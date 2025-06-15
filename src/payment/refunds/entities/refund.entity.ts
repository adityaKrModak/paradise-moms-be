import { ObjectType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { Payment } from '@/payment/payments/entities/payment.entity';
import { PaymentGateway } from '@/payment/payment-gateways/entities/payment-gateway.entity';

@ObjectType()
export class Refund {
  @Field()
  id: string;

  @Field(() => Payment)
  payment: Payment;

  @Field(() => PaymentGateway)
  gateway: PaymentGateway;

  @Field()
  gatewayRefundId: string;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field()
  status: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
