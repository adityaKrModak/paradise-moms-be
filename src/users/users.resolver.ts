import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Address } from './entities/address.entity';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create({
      ...createUserInput,
      role: UserRole.USER,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  async getCurrentUser(@Context() context) {
    console.log(context.req.user);
    return this.usersService.findOne(context.req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User, { name: 'updateUserInput' })
  updateUser(
    @Context() context,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    const userId = context.req.user.userId;
    if (updateUserInput.id !== userId) {
      throw new Error('You can only update your own profile');
    }
    if (updateUserInput.email) {
      throw new Error('You cannot update your email address.');
    }
    return this.usersService.update(userId, updateUserInput);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => User, { name: 'updateUserByAdmin' })
  updateUserByAdmin(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Address)
  addAddress(
    @Context() context,
    @Args('createAddressInput') createAddressInput: CreateAddressInput,
  ) {
    const userId = context.req.user.userId;
    return this.usersService.addAddress(userId, createAddressInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Address)
  updateAddress(
    @Context() context,
    @Args('updateAddressInput') updateAddressInput: UpdateAddressInput,
  ) {
    const userId = context.req.user.userId;
    return this.usersService.updateAddress(userId, updateAddressInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  removeAddress(@Context() context, @Args('addressId') addressId: number) {
    const userId = context.req.user.userId;
    return this.usersService.removeAddress(userId, addressId);
  }
}
