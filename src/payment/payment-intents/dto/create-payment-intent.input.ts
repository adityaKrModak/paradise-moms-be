import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
// 👇 IMPORT THE NECESSARY VALIDATORS
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreatePaymentIntentInput {
  @Field(() => Int)
  @IsNotEmpty() // Ensures the field is not null or undefined
  @IsInt() // Ensures the value is an integer
  orderId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  amount: number;

  @Field()
  @IsNotEmpty()
  @IsString() // Ensures the value is a string
  currency: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  gatewayId: number;

  @Field()
  @IsNotEmpty()
  @IsEmail() // Ensures the value is a valid email format
  email: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional() // Marks this property as optional for validation
  metadata?: Record<string, any>;
}
