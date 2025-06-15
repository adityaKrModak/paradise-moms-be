import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class ProductImageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  url: string;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  rank: number;
}
