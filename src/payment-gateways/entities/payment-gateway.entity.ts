import { ObjectType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { PaymentIntent } from '../../payment-intents/entities/payment-intent.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Refund } from '../../refunds/entities/refund.entity';

@ObjectType()
export class PaymentGateway {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  isActive: boolean;

  @Field(() => GraphQLJSON)
  config: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [PaymentIntent], { nullable: true })
  paymentIntents?: PaymentIntent[];

  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];

  @Field(() => [Refund], { nullable: true })
  refunds?: Refund[];
}
