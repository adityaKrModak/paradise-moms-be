import { Module } from '@nestjs/common';
import { RazorpayService } from '@/payment/razorpay/razorpay.service';
import { PaymentGatewaysModule } from '@/payment/payment-gateways/payment-gateways.module';

@Module({
  imports: [PaymentGatewaysModule],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
