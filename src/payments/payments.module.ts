import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsResolver } from './payments.resolver';
import { PaymentGatewaysModule } from 'src/payment-gateways/payment-gateways.module';
import { RazorpayModule } from 'src/razorpay/razorpay.module';

@Module({
  providers: [PaymentsResolver, PaymentsService],
  imports: [PaymentGatewaysModule, RazorpayModule],
})
export class PaymentsModule {}
