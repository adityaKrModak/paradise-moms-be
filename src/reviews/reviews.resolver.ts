import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Mutation(() => Review)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createReview(
    @Args('createReviewInput') createReviewInput: CreateReviewInput,
    @Context() context,
  ) {
    const loggedInUser = context.req.user;
    let userIdToAssign = loggedInUser.userId;

    if (createReviewInput.userId) {
      if (loggedInUser.role !== UserRole.ADMIN) {
        throw new Error(
          'You are not authorized to create a review for another user.',
        );
      }
      userIdToAssign = createReviewInput.userId;
    }

    return this.reviewsService.create(createReviewInput, userIdToAssign);
  }

  @Query(() => [Review], { name: 'reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Query(() => Review, { name: 'review' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Mutation(() => Review)
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Args('updateReviewInput') updateReviewInput: UpdateReviewInput,
    @Context() context,
  ) {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.reviewsService.update(
      updateReviewInput.id,
      updateReviewInput,
      userId,
      userRole,
    );
  }

  @Mutation(() => Review)
  @UseGuards(JwtAuthGuard)
  removeReview(
    @Args('id', { type: () => Int }) id: number,
    @Context() context,
  ) {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.reviewsService.remove(id, userId, userRole);
  }
}
