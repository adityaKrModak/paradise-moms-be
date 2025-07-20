import { Module } from '@nestjs/common';
import { PaymentsService } from '@/payment/payments/payments.service';
import { PaymentsResolver } from '@/payment/payments/payments.resolver';
import { PaymentsController } from '@/payment/payments/payments.controller';
import { PaymentGatewaysModule } from '@/payment/payment-gateways/payment-gateways.module';
import { RazorpayModule } from '@/payment/razorpay/razorpay.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsResolver, PaymentsService],
  imports: [PaymentGatewaysModule, RazorpayModule],
  exports: [PaymentsService],
})
export class PaymentsModule {}
