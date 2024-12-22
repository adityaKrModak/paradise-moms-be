import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { PaymentGatewaysModule } from 'src/payment-gateways/payment-gateways.module';

@Module({
  imports: [PaymentGatewaysModule],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
