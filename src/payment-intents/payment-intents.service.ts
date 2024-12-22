import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentIntentInput } from './dto/create-payment-intent.input';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';
import { RazorpayService } from '../razorpay/razorpay.service';

@Injectable()
export class PaymentIntentsService {
  constructor(
    private prisma: PrismaService,
    private paymentGatewaysService: PaymentGatewaysService,
    private razorpayService: RazorpayService,
  ) {}

  async create(
    createPaymentIntentInput: CreatePaymentIntentInput,
    userId: number,
  ) {
    const { orderId, email, amount, currency, gatewayId, metadata } =
      createPaymentIntentInput;

    // Verify order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ConflictException('Order does not belong to user');
    }

    // Check for existing payment intent within last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingIntent = await this.prisma.paymentIntent.findFirst({
      where: {
        orderId,
        userEmail: email,
        status: 'created',
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
    });

    if (existingIntent) {
      return existingIntent;
    }

    // Verify gateway exists and is active
    const gateway = await this.paymentGatewaysService.findById(gatewayId);
    if (!gateway.isActive) {
      throw new ConflictException('Payment gateway is not active');
    }

    // Create gateway-specific payment intent
    let gatewayIntentId: string;
    if (gateway.name.toLowerCase() === 'razorpay') {
      const razorpayOrder = await this.razorpayService.createOrder({
        amount,
        currency,
        notes: metadata,
      });
      gatewayIntentId = razorpayOrder.id;
    } else {
      throw new ConflictException(
        `Unsupported payment gateway: ${gateway.name}`,
      );
    }

    // Create payment intent record
    return this.prisma.paymentIntent.create({
      data: {
        orderId,
        amount,
        currency,
        status: 'created',
        userEmail: order.user.email,
        gatewayId,
        gatewayIntentId,
        metadata,
      },
    });
  }

  async findAll() {
    return this.prisma.paymentIntent.findMany({
      include: {
        order: true,
        gateway: true,
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { id },
      include: {
        order: true,
        gateway: true,
        payments: true,
      },
    });

    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    return intent;
  }

  async findByOrder(orderId: number) {
    return this.prisma.paymentIntent.findFirst({
      where: { orderId },
      include: {
        order: true,
        gateway: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
