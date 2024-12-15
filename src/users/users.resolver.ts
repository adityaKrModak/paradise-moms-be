import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserInput } from './dto/update-user.input';
import { Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  async getCurrentUser(@Request() req) {
    return this.usersService.findOne(req.user.userId);
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
    @Request() req,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    const userId = req.user.userId;
    if (updateUserInput.id !== userId) {
      throw new Error('You can only update your own profile');
    }
    return this.usersService.update(userId, updateUserInput);
  }
}
