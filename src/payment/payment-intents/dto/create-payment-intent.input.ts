import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreatePaymentIntentInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field(() => Int)
  gatewayId: number;

  @Field()
  email: string;
  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;
}
