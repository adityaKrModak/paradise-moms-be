// src/orders/entities/order-item.entity.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class OrderItem {
  @Field(() => Int)
  id: number;

  @Field(() => Order)
  order: Order;

  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  quantity: number;

  @Field()
  currency: string;

  @Field(() => Int)
  price: number;
}
