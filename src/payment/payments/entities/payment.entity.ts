import { ObjectType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { PaymentIntent } from '@/payment/payment-intents/entities/payment-intent.entity';
import { PaymentGateway } from '@/payment/payment-gateways/entities/payment-gateway.entity';
import { Refund } from '@/payment/refunds/entities/refund.entity';

export const PAYMENT_STATUS = {
  CREATED: 'created',
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  PAID: 'paid',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
} as const;

@ObjectType()
export class Payment {
  @Field()
  id: string;

  @Field(() => PaymentIntent)
  intent: PaymentIntent;

  @Field()
  intentId: string;

  @Field(() => PaymentGateway)
  gateway: PaymentGateway;

  @Field(() => Int)
  gatewayId: number;

  @Field()
  gatewayPaymentId: string;

  @Field({ nullable: true })
  gatewaySignature?: string;

  @Field()
  userEmail: string;

  @Field()
  status: string;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field(() => Int)
  amountRefunded: number;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Refund], { nullable: true })
  refunds?: Refund[];
}
