import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AddressType } from '@prisma/client';

@InputType()
export class CreateAddressInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  street: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  city: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  state: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  zip: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  country: string;

  @Field(() => AddressType, { nullable: true })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;
}
