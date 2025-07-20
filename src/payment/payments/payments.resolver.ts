import { Resolver, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import {
  SyncPaymentStatusResponse,
  SyncOrderPaymentsStatusResponse,
  BulkSyncPaymentsResponse,
} from './dto/sync-payment-status.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/entities/user.entity';
import {
  GraphQLContext,
  AuthUser,
} from '@/auth/interfaces/auth-user.interface';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => Payment, { name: 'verifyRazorpayPayment' })
  verifyRazorpayPayment(
    @Args('razorpayOrderId') razorpayOrderId: string,
    @Args('razorpayPaymentId') razorpayPaymentId: string,
    @Args('razorpaySignature') razorpaySignature: string,
  ) {
    return this.paymentsService.verifyRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  }

  @Mutation(() => SyncPaymentStatusResponse, {
    name: 'syncPaymentStatusFromRazorpay',
    description:
      'Sync payment status from Razorpay using our internal payment ID',
  })
  async syncPaymentStatusFromRazorpay(
    @Args('paymentId', { description: 'Internal payment ID' })
    paymentId: string,
    @Context() context: GraphQLContext,
  ) {
    await this.validatePaymentAccess(paymentId, context.req.user);
    return this.paymentsService.syncPaymentStatusFromRazorpay(paymentId);
  }

  @Mutation(() => SyncPaymentStatusResponse, {
    name: 'syncPaymentStatusByGatewayId',
    description: 'Sync payment status from Razorpay using Razorpay payment ID',
  })
  async syncPaymentStatusByGatewayId(
    @Args('gatewayPaymentId', { description: 'Razorpay payment ID' })
    gatewayPaymentId: string,
    @Context() context: GraphQLContext,
  ) {
    await this.validateGatewayPaymentAccess(gatewayPaymentId, context.req.user);
    return this.paymentsService.syncPaymentStatusByGatewayId(gatewayPaymentId);
  }

  @Mutation(() => SyncOrderPaymentsStatusResponse, {
    name: 'syncOrderPaymentsStatus',
    description: 'Sync all payment statuses for a specific order from Razorpay',
  })
  async syncOrderPaymentsStatus(
    @Args('orderId', { type: () => Int, description: 'Order ID' })
    orderId: number,
    @Context() context: GraphQLContext,
  ) {
    await this.validateOrderAccess(orderId, context.req.user);
    return this.paymentsService.syncOrderPaymentsStatus(orderId);
  }

  @Mutation(() => BulkSyncPaymentsResponse, {
    name: 'syncAllPendingPayments',
    description: 'Sync all pending payments from Razorpay (Admin only)',
  })
  @Roles(UserRole.ADMIN)
  syncAllPendingPayments() {
    return this.paymentsService.syncAllPendingPayments();
  }

  private async validatePaymentAccess(paymentId: string, user: AuthUser) {
    if (user.role === UserRole.ADMIN) {
      return; // Admins can access any payment
    }

    // Regular users can only access their own payments
    const payment = await this.paymentsService.findOne(paymentId);
    if (payment.userEmail !== user.email) {
      throw new ForbiddenException('You can only sync your own payments');
    }
  }

  private async validateGatewayPaymentAccess(
    gatewayPaymentId: string,
    user: AuthUser,
  ) {
    if (user.role === UserRole.ADMIN) {
      return; // Admins can access any payment
    }

    // Regular users can only access their own payments
    const payment =
      await this.paymentsService.findByGatewayPaymentId(gatewayPaymentId);
    if (payment.userEmail !== user.email) {
      throw new ForbiddenException('You can only sync your own payments');
    }
  }

  private async validateOrderAccess(orderId: number, user: AuthUser) {
    if (user.role === UserRole.ADMIN) {
      return; // Admins can access any order
    }

    // Regular users can only access their own orders
    const hasAccess = await this.paymentsService.checkOrderAccess(
      orderId,
      user.email,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You can only sync payments for your own orders',
      );
    }
  }
}
