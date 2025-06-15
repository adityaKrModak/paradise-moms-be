import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentGatewayInput } from './dto/create-payment.gateway.input';
import { UpdatePaymentGatewayInput } from './dto/update-payment.gateway.input';

@Injectable()
export class PaymentGatewaysService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentGatewayInput) {
    const existing = await this.findByName(data.name);
    if (existing) {
      throw new ConflictException(
        'Payment gateway with this name already exists',
      );
    }

    this.validateGatewayConfig(data.name, data.config);

    return this.prisma.paymentGateway.create({
      data: {
        name: data.name,
        isActive: data.isActive ?? true,
        config: data.config,
      },
    });
  }

  async findAll() {
    return this.prisma.paymentGateway.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { id },
    });

    if (!gateway) {
      throw new NotFoundException('Payment gateway not found');
    }

    return gateway;
  }

  async findByName(name: string) {
    return this.prisma.paymentGateway.findUnique({
      where: { name },
    });
  }

  async update(id: number, data: UpdatePaymentGatewayInput) {
    const gateway = await this.findById(id);

    if (data.name && data.name !== gateway.name) {
      const existingWithName = await this.findByName(data.name);
      if (existingWithName) {
        throw new ConflictException(
          'Payment gateway with this name already exists',
        );
      }
    }

    if (data.config) {
      this.validateGatewayConfig(data.name || gateway.name, data.config);
    }

    return this.prisma.paymentGateway.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.paymentGateway.delete({
      where: { id },
    });
  }

  async findActive() {
    return this.prisma.paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private validateGatewayConfig(
    gatewayName: string,
    config: Record<string, any>,
  ): void {
    const requiredFields: Record<string, string[]> = {
      razorpay: ['key_id', 'key_secret', 'webhook_secret'],
      hdfc: ['merchant_id', 'access_code', 'working_key'],
    };

    const fields = requiredFields[gatewayName.toLowerCase()];
    if (!fields) {
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
    }

    for (const field of fields) {
      if (!config[field]) {
        throw new Error(
          `Missing required field ${field} for gateway ${gatewayName}`,
        );
      }
    }
  }
}
