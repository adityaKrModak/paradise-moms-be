import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewaysResolver } from './payment-gateways.resolver';
import { PaymentGatewaysService } from './payment-gateways.service';

describe('PaymentGatewaysResolver', () => {
  let resolver: PaymentGatewaysResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentGatewaysResolver, PaymentGatewaysService],
    }).compile();

    resolver = module.get<PaymentGatewaysResolver>(PaymentGatewaysResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
