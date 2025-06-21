import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RazorpayService } from '@/payment/razorpay/razorpay.service';
import { PaymentGatewaysService } from '@/payment/payment-gateways/payment-gateways.service';
import { PrismaService } from 'prisma/prisma.service';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private paymentGatewaysService: PaymentGatewaysService,
    private configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        intent: true,
        gateway: true,
        refunds: true,
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        intent: true,
        gateway: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByGatewayPaymentId(gatewayPaymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayPaymentId },
      include: {
        intent: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_WEBHOOK_SECRET'))
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid Razorpay signature.');
    }

    // --- Signature is valid, now create the payment record ---

    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { gatewayIntentId: razorpayOrderId },
      include: { order: true },
    });

    if (!paymentIntent) {
      throw new BadRequestException('Payment Intent not found.');
    }

    const razorpayPayment =
      await this.razorpayService.razorpay.payments.fetch(razorpayPaymentId);

    if (razorpayPayment.status !== 'captured') {
      throw new BadRequestException('Payment not captured on Razorpay.');
    }

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        intentId: paymentIntent.id,
        gatewayId: paymentIntent.gatewayId,
        gatewayPaymentId: razorpayPaymentId,
        userEmail: paymentIntent.userEmail,
        status: 'success',
        amount: Number(razorpayPayment.amount),
        currency: razorpayPayment.currency,
        metadata: JSON.parse(JSON.stringify(razorpayPayment)),
      },
    });

    // Update the payment intent status
    await this.prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: 'PAID' },
    });

    // Update the order status
    await this.prisma.order.update({
      where: { id: paymentIntent.orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    return payment;
  }

  async handleRazorpayWebhook(signature: string, body: any) {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid Razorpay webhook signature.');
    }

    // --- Signature is valid, now process the event ---
    const event = body;

    if (event.event === 'payment.captured') {
      const razorpayPayment = event.payload.payment.entity;

      // --- Idempotency Check ---
      const existingPayment = await this.prisma.payment.findUnique({
        where: { gatewayPaymentId: razorpayPayment.id },
      });

      if (existingPayment) {
        console.log(`Payment ${razorpayPayment.id} already processed.`);
        return { received: true };
      }

      const paymentIntent = await this.prisma.paymentIntent.findUnique({
        where: { gatewayIntentId: razorpayPayment.order_id },
      });

      if (!paymentIntent) {
        throw new BadRequestException('Payment Intent not found for webhook.');
      }

      // Create the payment record
      const payment = await this.prisma.payment.create({
        data: {
          intentId: paymentIntent.id,
          gatewayId: paymentIntent.gatewayId,
          gatewayPaymentId: razorpayPayment.id,
          userEmail: paymentIntent.userEmail,
          status: 'success',
          amount: Number(razorpayPayment.amount),
          currency: razorpayPayment.currency,
          metadata: JSON.parse(JSON.stringify(razorpayPayment)),
        },
      });

      // Update the payment intent status
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'PAID' },
      });

      // Update the order status
      await this.prisma.order.update({
        where: { id: paymentIntent.orderId },
        data: { status: OrderStatus.PROCESSING },
      });

      console.log(`Successfully processed payment ${payment.id} via webhook.`);
    }

    return { received: true };
  }

  //   async verifyAndProcessPayment(params: {
  //     gatewayPaymentId: string;
  //     gatewaySignature?: string;
  //     metadata?: Record<string, any>;
  //   }) {
  //     const { gatewayPaymentId, gatewaySignature, metadata } = params;

  //     // Check if payment already processed

  //     const existingPayment = await this.findByGatewayPaymentId(gatewayPaymentId);
  //     if (existingPayment) {
  //     }

  //     // Get payment details from gateway
  //     const gatewayPayment =
  //       await this.razorpayService.getPaymentDetails(gatewayPaymentId);

  //     if (!gatewayPayment) {
  //       throw new BadRequestException('Invalid payment ID');
  //     }

  //     // Verify payment intent exists
  //     const intent = await this.prisma.paymentIntent.findUnique({
  //       where: { gatewayIntentId: gatewayPayment.order_id },
  //       include: { gateway: true },
  //     });

  //     if (!intent) {
  //       throw new BadRequestException('Invalid payment intent');
  //     }

  //     // Verify payment details match intent
  //     if (
  //       gatewayPayment.amount !== intent.amount ||
  //       gatewayPayment.currency !== intent.currency
  //     ) {
  //       throw new BadRequestException('Payment details mismatch');
  //     }

  //     // Create payment record
  //     const payment = await this.prisma.payment.create({
  //       data: {
  //         intentId: intent.id,
  //         gatewayId: intent.gatewayId,
  //         gatewayPaymentId,
  //         userEmail: intent.userEmail,
  //         status: PAYMENT_STATUS.AUTHORIZED,
  //         amount: gatewayPayment.amount,
  //         currency: gatewayPayment.currency,
  //         metadata: {
  //           ...metadata,
  //           gatewayResponse: gatewayPayment,
  //         } as any,
  //       },
  //       include: {
  //         intent: true,
  //       },
  //     });

  //     return payment;
  //   }

  //   async initiateRefund(params: {
  //     paymentId: string;
  //     amount: number;
  //     metadata?: Record<string, any>;
  //   }) {
  //     const { paymentId, amount, metadata } = params;

  //     const payment = await this.findOne(paymentId);

  //     // Verify payment can be refunded
  //     if (payment.status !== 'success') {
  //       throw new BadRequestException('Payment cannot be refunded');
  //     }

  //     if (payment.amountRefunded + amount > payment.amount) {
  //       throw new BadRequestException('Refund amount exceeds payment amount');
  //     }

  //     // Process refund with gateway
  //     const gatewayRefund = await this.razorpayService.initiateRefund({
  //       paymentId: payment.gatewayPaymentId,
  //       amount,
  //       notes: metadata,
  //     });

  //     // Create refund record
  //     const refund = await this.prisma.refund.create({
  //       data: {
  //         paymentId: payment.id,
  //         gatewayId: payment.gatewayId,
  //         gatewayRefundId: gatewayRefund.id,
  //         amount,
  //         currency: payment.currency,
  //         status: 'processing',
  //         metadata: {
  //           ...metadata,
  //           gatewayResponse: gatewayRefund,
  //         } as any,
  //       },
  //     });

  //     // Update payment status and refunded amount
  //     await this.prisma.payment.update({
  //       where: { id: payment.id },
  //       data: {
  //         amountRefunded: payment.amountRefunded + amount,
  //         status:
  //           payment.amountRefunded + amount === payment.amount
  //             ? 'refunded'
  //             : 'partially_refunded',
  //       },
  //     });

  //     return refund;
  //   }

  //   private mapGatewayStatus(gatewayStatus: string): string {
  //     // Map gateway-specific status to our standard statuses
  //     const statusMap: Record<string, string> = {
  //       created: 'pending',
  //       authorized: 'pending',
  //       captured: 'success',
  //       failed: 'failed',
  //       refunded: 'refunded',
  //     };

  //     return (
  //       statusMap[gatewayStatus.toLowerCase()] || gatewayStatus.toLowerCase()
  //     );
  //   }
}
