import { Test, TestingModule } from '@nestjs/testing';
import { VehicleResolver } from './vehicle.resolver';

describe('VehicleResolver', () => {
  let resolver: VehicleResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleResolver],
    }).compile();

    resolver = module.get<VehicleResolver>(VehicleResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
