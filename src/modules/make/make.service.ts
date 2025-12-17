import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MakeModel } from 'generated/prisma/models/Make';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class MakeService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<MakeModel[]> {
    return this.prisma.make.findMany();
  }

  async findById(id: string): Promise<MakeModel | null> {
    return this.prisma.make.findUnique({ where: { id } });
  }

  async findByMakeId(makeId: string): Promise<MakeModel | null> {
    return this.prisma.make.findUnique({ where: { makeId } });
  }

  async create(input: Prisma.MakeCreateInput): Promise<MakeModel> {
    return this.prisma.make.create({ data: input });
  }

  async update(
    input: Prisma.MakeUpdateInput & { id: string },
  ): Promise<MakeModel> {
    const { id, ...data } = input;
    return this.prisma.make.update({ where: { id }, data });
  }

  async delete(id: string): Promise<MakeModel> {
    return this.prisma.make.delete({ where: { id } });
  }
}
