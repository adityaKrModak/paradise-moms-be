import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGateway } from './entities/payment-gateway.entity';
import { CreatePaymentGatewayInput } from './dto/create-payment.gateway.input';
import { UpdatePaymentGatewayInput } from './dto/update-payment.gateway.input';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Resolver(() => PaymentGateway)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentGatewaysResolver {
  constructor(
    private readonly paymentGatewaysService: PaymentGatewaysService,
  ) {}

  @Mutation(() => PaymentGateway)
  @Roles(UserRole.ADMIN)
  createPaymentGateway(
    @Args('input') createPaymentGatewayInput: CreatePaymentGatewayInput,
  ) {
    return this.paymentGatewaysService.create(createPaymentGatewayInput);
  }

  @Query(() => [PaymentGateway], { name: 'paymentGateways' })
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.paymentGatewaysService.findAll();
  }

  @Query(() => [PaymentGateway], { name: 'activePaymentGateways' })
  findActive() {
    return this.paymentGatewaysService.findActive();
  }

  @Query(() => PaymentGateway, { name: 'paymentGateway' })
  @Roles(UserRole.ADMIN)
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.paymentGatewaysService.findById(id);
  }

  @Mutation(() => PaymentGateway)
  @Roles(UserRole.ADMIN)
  updatePaymentGateway(
    @Args('input') updatePaymentGatewayInput: UpdatePaymentGatewayInput,
  ) {
    return this.paymentGatewaysService.update(
      updatePaymentGatewayInput.id,
      updatePaymentGatewayInput,
    );
  }

  @Mutation(() => PaymentGateway)
  @Roles(UserRole.ADMIN)
  removePaymentGateway(@Args('id', { type: () => Int }) id: number) {
    return this.paymentGatewaysService.remove(id);
  }
}
