import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewInput: CreateReviewInput, userId: number) {
    return this.prisma.review.create({
      data: {
        ...createReviewInput,
        userId,
      },
      include: {
        user: true,
        product: true,
      },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: true,
        product: true,
      },
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} not found`);
    }

    return review;
  }

  async update(
    id: number,
    updateReviewInput: UpdateReviewInput,
    userId: number,
    userRole: UserRole,
  ) {
    const review = await this.findOne(id);

    if (review.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new UnauthorizedException('You can only update your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: updateReviewInput.rating,
        comment: updateReviewInput.comment,
      },
      include: {
        user: true,
        product: true,
      },
    });
  }

  async remove(id: number, userId: number, userRole: UserRole) {
    const review = await this.findOne(id);

    if (review.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new UnauthorizedException('You can only delete your own reviews');
    }

    return this.prisma.review.delete({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });
  }
}
