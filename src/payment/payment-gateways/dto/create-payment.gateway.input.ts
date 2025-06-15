import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreatePaymentGatewayInput {
  @Field()
  name: string;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => GraphQLJSON)
  config: Record<string, any>;
}
