import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentIntentInput } from './dto/create-payment-intent.input';
import { PaymentGatewaysService } from '@/payment/payment-gateways/payment-gateways.service';
import { RazorpayService } from '@/payment/razorpay/razorpay.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { OrderStatus } from '@prisma/client';
import { AuthUser } from '@/auth/interfaces/auth-user.interface';

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
    console.log('Payment intent input:', createPaymentIntentInput);
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
      include: {
        gateway: true,
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
      const razorpayOrder = await this.razorpayService.razorpay.orders.create({
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
      include: {
        order: true,
        gateway: true,
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

  async findByOrder(orderId: number, user: AuthUser) {
    // First check if the order belongs to the user (unless they're admin)
    if (user.role !== UserRole.ADMIN) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== user.userId) {
        throw new NotFoundException('Order not found'); // Don't reveal it exists
      }
    }

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

  async createRazorpayOrder(orderId: number, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order is not in a pending state.');
    }

    const razorpayGateway = await this.prisma.paymentGateway.findUnique({
      where: { name: 'razorpay' },
    });

    if (!razorpayGateway) {
      throw new NotFoundException('Razorpay payment gateway not found.');
    }

    const razorpayOrderOptions = {
      amount: order.totalPrice,
      currency: order.currency,
      receipt: order.id.toString(),
    };

    const razorpayOrder =
      await this.razorpayService.razorpay.orders.create(razorpayOrderOptions);

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        amount: order.totalPrice,
        currency: order.currency,
        status: 'created',
        userEmail: user.email,
        phoneNumber: user.phoneNumber,
        gatewayId: razorpayGateway.id,
        gatewayIntentId: razorpayOrder.id,
        metadata: JSON.parse(JSON.stringify(razorpayOrder)),
      },
      include: {
        gateway: true,
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    return paymentIntent;
  }
}
