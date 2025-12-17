import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Parent, ResolveField } from '@nestjs/graphql';
import type { MakeModel } from 'generated/prisma/models/Make';
import type { VehicleTypeModel } from 'generated/prisma/models/VehicleType';
import { VehicleService } from 'src/modules/vehicle/vehicle.service';
import { MakeService } from './make.service';

@Resolver('Make')
export class MakeResolver {
  constructor(
    private makeService: MakeService,
    private vehicleService: VehicleService,
  ) {}

  @Query('makes')
  async makes(): Promise<MakeModel[]> {
    return this.makeService.findAll();
  }

  @Query('make')
  async make(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<MakeModel | null> {
    return this.makeService.findById(id);
  }

  @Mutation('createMake')
  async createMake(
    @Args('input') input: { makeId: string; makeName: string },
  ): Promise<MakeModel> {
    return this.makeService.create(input);
  }

  @Mutation('updateMake')
  async updateMake(
    @Args('input') input: { id: string; makeId?: string; makeName?: string },
  ): Promise<MakeModel> {
    return this.makeService.update(input);
  }

  @Mutation('deleteMake')
  async deleteMake(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<MakeModel> {
    return this.makeService.delete(id);
  }

  @ResolveField('vehicleTypes')
  async vehicleTypes(@Parent() parent: MakeModel): Promise<VehicleTypeModel[]> {
    return this.vehicleService.findByMakeId(parent.makeId);
  }
}
