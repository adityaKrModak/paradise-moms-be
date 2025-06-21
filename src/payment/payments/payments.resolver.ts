import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';

@Resolver()
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => Payment, { name: 'verifyRazorpayPayment' })
  verifyRazorpayPayment(
    @Args('razorpayOrderId') razorpayOrderId: string,
    @Args('razorpayPaymentId') razorpayPaymentId: string,
    @Args('razorpaySignature') razorpaySignature: string,
  ) {
    return this.paymentsService.verifyRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  }
}
