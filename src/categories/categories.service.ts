import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(createCategoryInput: CreateCategoryInput) {
    return this.prisma.category.create({
      data: createCategoryInput,
    });
  }

  findAll() {
    return this.prisma.category.findMany({ include: { products: true } });
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  update(id: number, updateCategoryInput: UpdateCategoryInput) {
    const { id: _, ...data } = updateCategoryInput;
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
