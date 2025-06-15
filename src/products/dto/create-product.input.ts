import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  Min,
  IsJSON,
  IsObject,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';
import { ProductImageInput } from './product-image.input';
import { Type } from 'class-transformer';

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

  @Field(() => [ProductImageInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  imageUrls: ProductImageInput[];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @Field(() => [Int])
  @IsArray()
  @IsInt({ each: true })
  categoryIds: number[];
}
