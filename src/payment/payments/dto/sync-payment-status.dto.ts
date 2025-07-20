import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Payment } from '../entities/payment.entity';

@ObjectType()
export class SyncPaymentStatusResponse {
  @Field(() => Payment, { nullable: true })
  payment?: Payment;

  @Field()
  statusChanged: boolean;

  @Field()
  previousStatus: string;

  @Field()
  currentStatus: string;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  gatewayPaymentId?: string;
}

@ObjectType()
export class SyncOrderPaymentsStatusResponse {
  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  totalPayments: number;

  @Field(() => [SyncPaymentStatusResponse])
  syncResults: SyncPaymentStatusResponse[];
}

@ObjectType()
export class BulkSyncPaymentsResponse {
  @Field(() => Int)
  totalPayments: number;

  @Field(() => Int)
  successfulSyncs: number;

  @Field(() => Int)
  failedSyncs: number;

  @Field(() => [SyncPaymentStatusResponse])
  syncResults: SyncPaymentStatusResponse[];
}
