// src/products/entities/product.entity.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Review } from '../../reviews/entities/review.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { GraphQLJSON } from 'graphql-scalars';
import { ProductImage } from './product-image.entity';
import { Category } from 'src/categories/entities/category.entity';

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  currency: string;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [ProductImage])
  imageUrls: ProductImage[];

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => [OrderItem], { nullable: true })
  orderItems?: OrderItem[];

  @Field(() => [Category], { nullable: 'itemsAndList' })
  categories?: Category[];
}
