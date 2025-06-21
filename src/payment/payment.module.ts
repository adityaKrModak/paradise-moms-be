import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { PaymentIntentsModule } from './payment-intents/payment-intents.module';
import { RefundsModule } from './refunds/refunds.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    PaymentsModule,
    PaymentIntentsModule,
    RefundsModule,
    RazorpayModule,
    WebhooksModule,
  ],
  exports: [
    PaymentsModule,
    PaymentIntentsModule,
    RefundsModule,
    RazorpayModule,
  ],
})
export class PaymentModule {}
