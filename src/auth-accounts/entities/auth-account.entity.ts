// src/auth/entities/auth-account.entity.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class AuthAccount {
  @Field(() => Int)
  id: number;

  @Field()
  oauthProvider: string;

  @Field()
  oauthId: string;

  @Field(() => User)
  user: User;
}
