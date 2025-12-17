import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { VehicleTypeModel } from 'generated/prisma/models/VehicleType';
import type { MakeModel } from 'generated/prisma/models/Make';
import { VehicleService } from './vehicle.service';
import { MakeService } from 'src/modules/make/make.service';

@Resolver('VehicleType')
export class VehicleResolver {
  constructor(
    private vehicleService: VehicleService,
    private makeService: MakeService,
  ) {}

  @Query('vehicleTypes')
  async vehicleTypes(): Promise<VehicleTypeModel[]> {
    return this.vehicleService.findAll();
  }

  @Query('vehicleType')
  async vehicleType(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<VehicleTypeModel | null> {
    return this.vehicleService.findById(id);
  }

  @Query('vehicleTypesByMakeId')
  async vehicleTypesByMakeId(
    @Args('makeId') makeId: string,
  ): Promise<VehicleTypeModel[]> {
    return this.vehicleService.findByMakeId(makeId);
  }

  @Mutation('createVehicleType')
  async createVehicleType(
    @Args('input')
    input: {
      vehicleTypeId: string;
      vehicleTypeName: string;
      makeId: string;
    },
  ): Promise<VehicleTypeModel> {
    return this.vehicleService.create({
      vehicleTypeId: input.vehicleTypeId,
      vehicleTypeName: input.vehicleTypeName,
      make: {
        connect: { id: input.makeId },
      },
    });
  }

  @Mutation('updateVehicleType')
  async updateVehicleType(
    @Args('input')
    input: {
      id: string;
      vehicleTypeId?: string;
      vehicleTypeName?: string;
      makeId?: string;
    },
  ): Promise<VehicleTypeModel> {
    return this.vehicleService.update(input);
  }

  @Mutation('deleteVehicleType')
  async deleteVehicleType(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<VehicleTypeModel> {
    return this.vehicleService.delete(id);
  }

  @ResolveField('make')
  async make(@Parent() parent: VehicleTypeModel): Promise<MakeModel | null> {
    if (!parent.makeId) return null;
    return this.makeService.findByMakeId(parent.makeId);
  }
}
