import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductInput: CreateProductInput) {
    const { imageUrls, categoryIds, ...productData } = createProductInput;
    return this.prisma.product.create({
      data: {
        ...productData,
        imageUrls: imageUrls as unknown as Prisma.InputJsonValue,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
      include: {
        categories: true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        reviews: true,
        orderItems: true,
        categories: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        reviews: true,
        orderItems: true,
        categories: true,
      },
    });
  }

  async update(id: number, updateProductInput: UpdateProductInput) {
    const { imageUrls, categoryIds, ...productData } = updateProductInput;

    const data: Prisma.ProductUpdateInput = { ...productData };
    if (imageUrls) {
      data.imageUrls = imageUrls as unknown as Prisma.InputJsonValue;
    }
    if (categoryIds) {
      data.categories = {
        set: categoryIds.map((id) => ({ id })),
      };
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        categories: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
