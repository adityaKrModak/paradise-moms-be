import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, IsString, Min } from 'class-validator';

@InputType()
export class CreateOrderItemInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [CreateOrderItemInput])
  @IsNotEmpty()
  orderItems: CreateOrderItemInput[];

  @Field()
  @IsString()
  @IsNotEmpty()
  currency: string;
}
