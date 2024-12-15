import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

@InputType()
export class UpdateOrderInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
