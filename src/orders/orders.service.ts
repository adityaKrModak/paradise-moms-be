import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderInput: CreateOrderInput, userId: number) {
    const { orderItems, currency, addressId } = createOrderInput;
    let totalPrice = 0;

    // Fetch and validate the address
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException(`Address #${addressId} not found`);
    }
    if (address.userId !== userId) {
      throw new UnauthorizedException(
        `You do not have permission to use this address.`,
      );
    }
    const { id: _addressId, userId: _userId, ...addressSnapshot } = address;

    // Get all products and calculate total price
    const products = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(`Product #${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product #${item.productId}`);
        }
        totalPrice += product.price * item.quantity;
        return product;
      }),
    );

    // Create order with items
    return this.prisma.order.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        status: OrderStatus.PENDING,
        totalPrice,
        currency,
        address: addressSnapshot,
        orderItems: {
          create: orderItems.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products[index].price,
            currency: currency,
          })),
        },
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
