import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class CreatePaymentGatewayInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => GraphQLJSON)
  @IsNotEmpty()
  config: Record<string, any>;
}
