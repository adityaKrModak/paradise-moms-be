import { Module } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysResolver } from './payment-gateways.resolver';

@Module({
  providers: [PaymentGatewaysResolver, PaymentGatewaysService],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysModule {}
