import { forwardRef, Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleResolver } from './vehicle.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MakeModule } from 'src/modules/make/make.module';

@Module({
  imports: [PrismaModule, forwardRef(() => MakeModule)],
  providers: [VehicleService, VehicleResolver],
  exports: [VehicleService],
})
export class VehicleModule {}
