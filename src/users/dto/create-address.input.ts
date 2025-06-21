import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AddressType } from '@prisma/client';

@InputType()
export class CreateAddressInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  fullName?: string;

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

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @Field(() => AddressType, { defaultValue: AddressType.SECONDARY })
  @IsEnum(AddressType)
  @IsOptional()
  addressType?: AddressType;
}
