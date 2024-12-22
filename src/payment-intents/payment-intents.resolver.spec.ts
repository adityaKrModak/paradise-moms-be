import { Test, TestingModule } from '@nestjs/testing';
import { PaymentIntentsResolver } from './payment-intents.resolver';
import { PaymentIntentsService } from './payment-intents.service';

describe('PaymentIntentsResolver', () => {
  let resolver: PaymentIntentsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentIntentsResolver, PaymentIntentsService],
    }).compile();

    resolver = module.get<PaymentIntentsResolver>(PaymentIntentsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
