import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrderStatus } from './entities/order.entity';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderInput: CreateOrderInput, userId: number) {
    const { orderItems, addressId } = createOrderInput;

    const productIds = orderItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;
    for (const item of orderItems) {
      const product = productMap.get(item.productId);
      totalPrice += product.price * item.quantity;
    }

    const address = await this.prisma.address.findUnique({
      where: { id: addressId, userId: userId },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${addressId} not found for this user.`,
      );
    }

    return this.prisma.order.create({
      data: {
        userId,
        status: PrismaOrderStatus.PENDING,
        totalPrice,
        currency: createOrderInput.currency,
        address: {
          fullName: address.fullName,
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          phoneNumber: address.phoneNumber,
        },
        orderItems: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: productMap.get(item.productId).price,
            currency: createOrderInput.currency,
          })),
        },
      },
      include: {
        orderItems: true,
        user: true,
      },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  async findUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async update(id: number, updateOrderInput: UpdateOrderInput) {
    await this.findOne(id);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderInput.status,
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
