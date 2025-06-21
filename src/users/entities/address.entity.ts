import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';
import { AddressType } from '@prisma/client';

registerEnumType(AddressType, {
  name: 'AddressType',
});

@ObjectType()
export class Address {
  @Field(() => Int)
  id: number;

  @Field()
  fullName: string;

  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zip: string;

  @Field()
  country: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field(() => AddressType)
  addressType: AddressType;

  @Field(() => User)
  user: User;
}
