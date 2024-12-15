import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Review {
  @Field(() => Int)
  id: number;

  @Field(() => Product)
  product: Product;

  @Field(() => User)
  user: User;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  createdAt: Date;
}
