import { Test, TestingModule } from '@nestjs/testing';
import { MakeResolver } from './make.resolver';

describe('MakeResolver', () => {
  let resolver: MakeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MakeResolver],
    }).compile();

    resolver = module.get<MakeResolver>(MakeResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
