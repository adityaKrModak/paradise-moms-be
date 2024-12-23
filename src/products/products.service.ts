import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductInput: CreateProductInput) {
    return this.prisma.product.create({
      data: createProductInput,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        reviews: true,
        orderItems: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        reviews: true,
        orderItems: true,
      },
    });
  }

  async update(id: number, updateProductInput: UpdateProductInput) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductInput,
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
