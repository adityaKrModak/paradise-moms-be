import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  Min,
  IsJSON,
  IsObject,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  currency: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => GraphQLJSON)
  @IsObject()
  imageUrls: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  metadata?: Record<string, any>;
}
