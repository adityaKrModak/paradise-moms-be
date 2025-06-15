import { Module } from '@nestjs/common';
import { PaymentGatewaysService } from '@/payment/payment-gateways/payment-gateways.service';
import { PaymentGatewaysResolver } from '@/payment/payment-gateways/payment-gateways.resolver';

@Module({
  providers: [PaymentGatewaysResolver, PaymentGatewaysService],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysModule {}
