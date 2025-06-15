import { Module } from '@nestjs/common';
import { PaymentIntentsService } from '@/payment/payment-intents/payment-intents.service';
import { PaymentIntentsResolver } from '@/payment/payment-intents/payment-intents.resolver';
import { RazorpayModule } from '@/payment/razorpay/razorpay.module';
import { PaymentGatewaysModule } from '@/payment/payment-gateways/payment-gateways.module';

@Module({
  imports: [RazorpayModule, PaymentGatewaysModule],
  providers: [PaymentIntentsResolver, PaymentIntentsService],
})
export class PaymentIntentsModule {}
