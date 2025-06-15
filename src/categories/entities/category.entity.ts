import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class Category {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  products?: Product[];
}
