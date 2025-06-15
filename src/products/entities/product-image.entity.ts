import { ObjectType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

@ObjectType()
export class ProductImage {
  @Field()
  @IsString()
  @IsNotEmpty()
  url: string;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  rank: number;
}
