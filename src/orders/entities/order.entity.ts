// src/orders/entities/order.entity.ts
import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
});

@ObjectType()
export class Order {
  @Field(() => Int)
  id: number;

  @Field(() => User)
  user: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Int)
  totalPrice: number;

  @Field()
  currency: string;

  @Field(() => [OrderItem], { nullable: true })
  orderItems?: OrderItem[];
}
