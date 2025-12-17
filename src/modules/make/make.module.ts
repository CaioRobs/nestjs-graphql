import { forwardRef, Module } from '@nestjs/common';
import { MakeService } from './make.service';
import { MakeResolver } from './make.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VehicleModule } from 'src/modules/vehicle/vehicle.module';

@Module({
  imports: [PrismaModule, forwardRef(() => VehicleModule)],
  providers: [MakeService, MakeResolver],
  exports: [MakeService],
})
export class MakeModule {}
