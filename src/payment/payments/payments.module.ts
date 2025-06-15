import { Module } from '@nestjs/common';
import { PaymentsService } from '@/payment/payments/payments.service';
import { PaymentsResolver } from '@/payment/payments/payments.resolver';
import { PaymentGatewaysModule } from '@/payment/payment-gateways/payment-gateways.module';
import { RazorpayModule } from '@/payment/razorpay/razorpay.module';

@Module({
  providers: [PaymentsResolver, PaymentsService],
  imports: [PaymentGatewaysModule, RazorpayModule],
})
export class PaymentsModule {}
