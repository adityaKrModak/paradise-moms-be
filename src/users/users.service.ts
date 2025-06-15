import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma, AddressType } from '@prisma/client';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: {
        ...data,
      },
    });
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

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: true,
      },
    });
  }

  async addAddress(userId: number, createAddressInput: CreateAddressInput) {
    const { street, city, state, zip, country } = createAddressInput;
    const existingAddress = await this.prisma.address.findUnique({
      where: {
        street_city_state_zip_country_userId: {
          street,
          city,
          state,
          zip,
          country,
          userId,
        },
      },
    });

    if (existingAddress) {
      throw new ConflictException('This address already exists.');
    }

    return this.prisma.address.create({
      data: {
        ...createAddressInput,
        userId,
      },
    });
  }

  async updateAddress(userId: number, updateAddressInput: UpdateAddressInput) {
    const { id, ...data } = updateAddressInput;
    // Make sure the address belongs to the user
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new Error(
        'Address not found or you do not have permission to update it.',
      );
    }
    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async removeAddress(userId: number, addressId: number) {
    // Make sure the address belongs to the user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new Error(
        'Address not found or you do not have permission to delete it.',
      );
    }
    await this.prisma.address.delete({ where: { id: addressId } });
    return true;
  }
}
