import { Test, TestingModule } from '@nestjs/testing';
import { MakeService } from './make.service';

describe('MakeService', () => {
  let service: MakeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MakeService],
    }).compile();

    service = module.get<MakeService>(MakeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
