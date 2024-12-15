// src/users/entities/user.entity.ts
import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';
import { AuthAccount } from '../../auth-accounts/entities/auth-account.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role types',
});
@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  phoneNumber?: string;

  @Field(() => UserRole, {
    description: 'User role for authorization',
    defaultValue: UserRole.USER,
  })
  role: UserRole;

  @Field(() => [Order], { nullable: true })
  orders?: Order[];

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [AuthAccount], { nullable: true })
  authAccounts?: AuthAccount[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
