import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        () => ({
          NODE_ENV: process.env.NODE_ENV ?? 'development',
          PORT: process.env.PORT ?? '4000',
          DATABASE_URL:
            process.env.DATABASE_URL ??
            'postgresql://myuser:mypassword@db:5432/pdgb',
          MAKES_URL:
            process.env.MAKES_URL ??
            'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML',
          VEHICLE_TYPES_URL:
            process.env.VEHICLE_TYPES_URL ??
            'https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/{makeId}?format=XML',
          MAX_MAKES_TO_INGEST: process.env.MAX_MAKES_TO_INGEST ?? '0',
          MAX_CONCURRENT_FETCHS: process.env.MAX_CONCURRENT_FETCHS ?? '12',
          RETRY_ATTEMPTS: process.env.RETRY_ATTEMPTS ?? '5',
          RETRY_BASE_DELAY_MS: process.env.RETRY_BASE_DELAY_MS ?? '8000',
          RETRY_MAX_DELAY_MS: process.env.RETRY_MAX_DELAY_MS ?? '800000',
        }),
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
