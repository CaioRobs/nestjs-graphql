import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import type { VehicleTypeModel } from 'generated/prisma/models/VehicleType';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<VehicleTypeModel[]> {
    return this.prisma.vehicleType.findMany();
  }

  async findById(id: string): Promise<VehicleTypeModel | null> {
    return this.prisma.vehicleType.findUnique({ where: { id } });
  }

  async findByMakeId(makeId: string): Promise<VehicleTypeModel[]> {
    return this.prisma.vehicleType.findMany({ where: { makeId } });
  }

  async create(
    input: Prisma.VehicleTypeCreateInput,
  ): Promise<VehicleTypeModel> {
    return this.prisma.vehicleType.create({ data: input });
  }

  async update(
    input: Prisma.VehicleTypeUpdateInput & { id: string },
  ): Promise<VehicleTypeModel> {
    const { id, ...data } = input;
    return this.prisma.vehicleType.update({ where: { id }, data });
  }

  async delete(id: string): Promise<VehicleTypeModel> {
    return this.prisma.vehicleType.delete({ where: { id } });
  }
}
