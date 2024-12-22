import { Module } from '@nestjs/common';
import { PaymentIntentsService } from './payment-intents.service';
import { PaymentIntentsResolver } from './payment-intents.resolver';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { PaymentGatewaysModule } from 'src/payment-gateways/payment-gateways.module';

@Module({
  imports: [RazorpayModule, PaymentGatewaysModule],
  providers: [PaymentIntentsResolver, PaymentIntentsService],
})
export class PaymentIntentsModule {}
