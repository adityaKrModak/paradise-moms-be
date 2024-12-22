import { CreatePaymentGatewayInput } from './create-payment.gateway.input';
import { InputType, PartialType, Field, Int } from '@nestjs/graphql';

@InputType()
export class UpdatePaymentGatewayInput extends PartialType(
  CreatePaymentGatewayInput,
) {
  @Field(() => Int)
  id: number;
}
