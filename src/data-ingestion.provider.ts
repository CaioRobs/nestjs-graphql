import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma/prisma.service';

interface MakesDoc {
  Response: {
    Count: number;
    Message: string;
    Results: {
      AllVehicleMakes: {
        Make_ID: number;
        Make_Name: string;
      }[];
    };
  };
}

interface VehicleTypesDoc {
  Response: {
    Count: number;
    Message: string;
    SearchCriteria: string;
    Results: {
      VehicleTypesForMakeIds:
        | {
            VehicleTypeId: number;
            VehicleTypeName: string;
          }[]
        | {
            VehicleTypeId: number;
            VehicleTypeName: string;
          };
    };
  };
}

interface VehicleType {
  typeId: string;
  typeName: string;
}

interface Make {
  makeId: string;
  makeName: string;
  vehicleTypes: VehicleType[];
}

@Injectable()
export class DataIngestionProvider implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataIngestionProvider.name);
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async fetchWithTimeout(
    url: string,
    timeoutMs = 15000,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        this.logger.debug(res);
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }

      return await res.text();
    } catch (error) {
      this.logger.error(error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithRetry(url: string): Promise<string> {
    const attempts = Number(this.configService.get('RETRY_ATTEMPTS'));
    const baseDelayMs = Number(this.configService.get('RETRY_BASE_DELAY_MS'));
    const maxDelayMs = Number(this.configService.get('RETRY_MAX_DELAY_MS'));

    let lastErr: unknown;

    for (let i = 0; i < attempts; i++) {
      try {
        return await this.fetchWithTimeout(url);
      } catch (err) {
        lastErr = err;
        const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** i);
        const jitter = Math.random() * 0.2 * delay;
        const sleepMs = delay + jitter;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Fetch failed (attempt ${i + 1}/${attempts}): ${msg}. Retrying in ${Math.round(
            sleepMs,
          )}ms...`,
        );
        await new Promise((r) => setTimeout(r, sleepMs));
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error(
          typeof lastErr === 'string'
            ? lastErr
            : typeof lastErr === 'number'
              ? String(lastErr)
              : 'Unknown fetch error',
        );
  }

  private async getMakes(): Promise<Make[]> {
    const makesUrl = this.configService.get<string>('MAKES_URL');
    const maxMakes = Number(
      this.configService.get<string>('MAX_MAKES_TO_INGEST'),
    );

    if (!makesUrl) {
      this.logger.warn(
        'Env MAKES_URL not configured. Skipping Makes ingestion.',
      );
      return [];
    }

    try {
      this.logger.log(`Fetching Makes from ${makesUrl}...`);
      const raw = await this.fetchWithRetry(makesUrl);
      const makes = this.parseMakesXml(raw);

      this.logger.debug(`Makes parsed=${makes.length}`);

      if (maxMakes > 0 && makes.length > maxMakes) {
        this.logger.log(
          `Limiting Makes to first ${maxMakes} of ${makes.length} as per configuration.`,
        );
        return makes.slice(0, maxMakes);
      }

      return makes;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      this.logger.error(`Error fetching or parsing Makes: ${msg}`, err);

      return [];
    }
  }

  private async getVehicleTypes(
    vehicleTypesUrl: string,
  ): Promise<VehicleType[]> {
    try {
      const raw = await this.fetchWithRetry(vehicleTypesUrl);
      const vehicleTypes = this.parseVehicleTypesXml(raw);

      return vehicleTypes;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      this.logger.error(`VehicleTypes fetch or parse failure: ${msg}`, err);

      return [];
    }
  }

  private async storeData(data: Make[]): Promise<void> {
    for (const make of data) {
      const makeRecord = await this.prisma.make.upsert({
        where: { makeId: make.makeId },
        create: {
          makeId: make.makeId,
          makeName: make.makeName,
        },
        update: {
          makeName: make.makeName,
        },
      });
      for (const vehicleType of make.vehicleTypes) {
        await this.prisma.vehicleType.upsert({
          where: {
            makeId_vehicleTypeId: {
              makeId: makeRecord.makeId,
              vehicleTypeId: vehicleType.typeId,
            },
          },
          create: {
            id: randomUUID(),
            vehicleTypeId: vehicleType.typeId,
            vehicleTypeName: vehicleType.typeName,
            makeId: makeRecord.makeId,
          },
          update: {
            vehicleTypeName: vehicleType.typeName,
            makeId: makeRecord.makeId,
          },
        });
      }
    }
  }

  async getData(): Promise<void> {
    try {
      const makes = await this.getMakes();
      this.logger.log(`Makes: ${makes.length}`);
      const vehicleTypesGenericUrl =
        this.configService.get<string>('VEHICLE_TYPES_URL');

      let makesWithVehicleTypes: Make[] = [];
      if (!vehicleTypesGenericUrl) {
        this.logger.warn(
          'Env VEHICLE_TYPES_URL not configured. Skipping VehicleTypes ingestion.',
        );
        return;
      } else {
        const maxConcurrentFetchs = Number(
          this.configService.get<string>('MAX_CONCURRENT_FETCHS'),
        );
        const limit = pLimit(maxConcurrentFetchs);

        let i = 0;
        makesWithVehicleTypes = await Promise.all(
          makes.map((make) =>
            limit(async () => {
              const vehicleTypesUrl = vehicleTypesGenericUrl.replace(
                '{makeId}',
                make.makeId,
              );
              make.vehicleTypes = await this.getVehicleTypes(vehicleTypesUrl);
              i++;
              if (i % 100 === 0)
                this.logger.log(
                  `${((i * 100) / makes.length).toFixed(2)}% done fetching VehicleTypes...`,
                );
              return make;
            }),
          ),
        );
      }

      const toPersist =
        makesWithVehicleTypes.length !== 0 ? makesWithVehicleTypes : makes;

      this.logger.log(
        `Ready to store: ${toPersist.length} makes with VehicleTypes.`,
      );

      await this.storeData(toPersist);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error on Data ingestion: ${message}`);
    }

    return;
  }

  private parseMakesXml(xml: string): Make[] {
    const parser = new XMLParser({ ignoreAttributes: false });
    const doc: MakesDoc = parser.parse(xml) as MakesDoc;

    const parsed: {
      makeId: string;
      makeName: string;
      vehicleTypes: never[];
    }[] = [];

    for (const make of doc.Response.Results.AllVehicleMakes) {
      const makeId = make.Make_ID;
      const makeName = make.Make_Name;

      if (!makeId || !makeName) continue;

      parsed.push({
        makeId: makeId.toString(),
        makeName: makeName.toString(),
        vehicleTypes: [],
      });
    }

    if (parsed.length === 0) {
      this.logger.warn('Makes Parser found nothing on XML.');
    }

    return parsed;
  }

  private parseVehicleTypesXml(xml: string): VehicleType[] {
    const parser = new XMLParser({ ignoreAttributes: false });
    const doc: VehicleTypesDoc = parser.parse(xml) as VehicleTypesDoc;

    const parsed: VehicleType[] = [];

    if (Array.isArray(doc.Response.Results.VehicleTypesForMakeIds)) {
      for (const vehicleType of doc.Response.Results.VehicleTypesForMakeIds) {
        const vehicleTypeId = vehicleType?.VehicleTypeId;
        const vehicleTypeName = vehicleType?.VehicleTypeName;

        if (!vehicleTypeId || !vehicleTypeName) continue;
        parsed.push({
          typeId: vehicleTypeId.toString(),
          typeName: vehicleTypeName.toString(),
        });
      }
    } else {
      const vehicleType = doc.Response.Results.VehicleTypesForMakeIds;
      const vehicleTypeId = vehicleType?.VehicleTypeId;
      const vehicleTypeName = vehicleType?.VehicleTypeName;

      if (!vehicleTypeId || !vehicleTypeName) return [];

      parsed.push({
        typeId: vehicleTypeId.toString(),
        typeName: vehicleTypeName.toString(),
      });
    }

    return parsed;
  }

  onApplicationBootstrap(): void {
    void this.getData()
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error getting data on app bootstrap: ${msg}`);
      })
      .then(() => this.logger.log('Done getting data!'));
  }
}
