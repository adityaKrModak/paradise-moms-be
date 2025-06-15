import { ObjectType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { Order } from '@/orders/entities/order.entity';
import { PaymentGateway } from '@/payment/payment-gateways/entities/payment-gateway.entity';
import { Payment } from '@/payment/payments/entities/payment.entity';

export const PAYMENT_INTENT_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
} as const;

@ObjectType()
export class PaymentIntent {
  @Field()
  id: string;

  @Field(() => Order)
  order: Order;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field()
  status: string; // created,paid

  @Field()
  userEmail: string;

  @Field(() => PaymentGateway)
  gateway: PaymentGateway;

  @Field(() => Int)
  gatewayId: number;

  @Field()
  gatewayIntentId: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];
}
