import { Test, TestingModule } from '@nestjs/testing';
import { RefundsResolver } from './refunds.resolver';
import { RefundsService } from './refunds.service';

describe('RefundsResolver', () => {
  let resolver: RefundsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefundsResolver, RefundsService],
    }).compile();

    resolver = module.get<RefundsResolver>(RefundsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
