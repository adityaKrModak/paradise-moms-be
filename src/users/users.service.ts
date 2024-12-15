import { Injectable } from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: Role.USER, // Default role for new users
      },
    });
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        authAccounts: true,
      },
    });
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    const { firstName, lastName, phoneNumber } = updateUserInput;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
      },
    });
  }
}
