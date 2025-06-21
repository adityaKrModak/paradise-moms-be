import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateAddressInput } from './create-address.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateAddressInput extends PartialType(CreateAddressInput) {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;
}
