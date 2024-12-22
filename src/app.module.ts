import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { join } from 'path';
import { GraphQLModule } from '@nestjs/graphql';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthAccountsModule } from './auth-accounts/auth-accounts.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLJSON } from 'graphql-scalars';
import { PaymentGatewaysModule } from './payment-gateways/payment-gateways.module';
import { PaymentIntentsModule } from './payment-intents/payment-intents.module';
import { PaymentsModule } from './payments/payments.module';
import { RefundsModule } from './refunds/refunds.module';
import { RazorpayModule } from './razorpay/razorpay.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      resolvers: { JSON: GraphQLJSON },
    }),
    AuthModule,
    PrismaModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    ReviewsModule,
    AuthAccountsModule,
    PaymentGatewaysModule,
    PaymentIntentsModule,
    PaymentsModule,
    RefundsModule,
    RazorpayModule,
  ],
})
export class AppModule {}
