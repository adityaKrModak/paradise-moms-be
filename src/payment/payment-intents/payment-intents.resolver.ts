import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { PaymentIntentsService } from './payment-intents.service';
import { PaymentIntent } from './entities/payment-intent.entity';
import { CreatePaymentIntentInput } from './dto/create-payment-intent.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/entities/user.entity';

@Resolver(() => PaymentIntent)
export class PaymentIntentsResolver {
  constructor(private readonly paymentIntentsService: PaymentIntentsService) {}

  @Mutation(() => PaymentIntent, { name: 'createRazorpayOrder' })
  @UseGuards(JwtAuthGuard)
  createRazorpayOrder(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Context() context,
  ) {
    const user = context.req.user;
    return this.paymentIntentsService.createRazorpayOrder(orderId, user);
  }

  @Mutation(() => PaymentIntent)
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @Args('input') createPaymentIntentInput: CreatePaymentIntentInput,
    @Context() context,
  ) {
    const userId = context.req.user.userId;
    return this.paymentIntentsService.create(createPaymentIntentInput, userId);
  }

  @Query(() => [PaymentIntent], { name: 'paymentIntents' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.paymentIntentsService.findAll();
  }

  @Query(() => PaymentIntent, { name: 'paymentIntent' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Args('id') id: string) {
    return this.paymentIntentsService.findOne(id);
  }

  @Query(() => PaymentIntent, { name: 'paymentIntentByOrder' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findByOrder(@Args('orderId', { type: () => Int }) orderId: number) {
    return this.paymentIntentsService.findByOrder(orderId);
  }
}
