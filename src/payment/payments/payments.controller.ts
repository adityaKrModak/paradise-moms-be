import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/entities/user.entity';
import { RestRequest, AuthUser } from '@/auth/interfaces/auth-user.interface';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Users can sync their own payments, Admins can sync any payment
  @Post('sync/:paymentId')
  @HttpCode(HttpStatus.OK)
  async syncPaymentStatus(
    @Param('paymentId') paymentId: string,
    @Request() req: RestRequest,
  ) {
    await this.validatePaymentAccess(paymentId, req.user);
    return this.paymentsService.syncPaymentStatusFromRazorpay(paymentId);
  }

  // Users can sync their own payments, Admins can sync any payment
  @Post('sync/gateway/:gatewayPaymentId')
  @HttpCode(HttpStatus.OK)
  async syncPaymentStatusByGatewayId(
    @Param('gatewayPaymentId') gatewayPaymentId: string,
    @Request() req: RestRequest,
  ) {
    await this.validateGatewayPaymentAccess(gatewayPaymentId, req.user);
    return this.paymentsService.syncPaymentStatusByGatewayId(gatewayPaymentId);
  }

  // Users can sync their own orders, Admins can sync any order
  @Post('sync/order/:orderId')
  @HttpCode(HttpStatus.OK)
  async syncOrderPaymentsStatus(
    @Param('orderId') orderId: string,
    @Request() req: RestRequest,
  ) {
    const orderIdNum = parseInt(orderId, 10);
    if (isNaN(orderIdNum)) {
      throw new Error('Invalid order ID');
    }
    await this.validateOrderAccess(orderIdNum, req.user);
    return this.paymentsService.syncOrderPaymentsStatus(orderIdNum);
  }

  // Admin only - bulk operations
  @Post('sync/bulk/pending')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async syncAllPendingPayments() {
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
