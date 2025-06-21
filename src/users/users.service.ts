import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma, AddressType } from '@prisma/client';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserInput: Prisma.UserCreateInput) {
    try {
      return await this.prisma.user.create({
        data: createUserInput,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists.');
      }
      throw error;
    }
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
    const { role, ...data } = updateUserInput;

    if (role) {
      throw new Error('Role cannot be updated.');
    }

    return this.prisma.user.update({
      where: { id },
      data,
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
    const { addressType } = createAddressInput;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const fullName =
      createAddressInput.fullName || `${user.firstName} ${user.lastName}`;
    const phoneNumber = createAddressInput.phoneNumber || user.phoneNumber;

    try {
      if (addressType === AddressType.PRIMARY) {
        return this.prisma.$transaction(async (tx) => {
          await tx.address.updateMany({
            where: { userId, addressType: AddressType.PRIMARY },
            data: { addressType: AddressType.SECONDARY },
          });
          return tx.address.create({
            data: {
              ...createAddressInput,
              userId,
              fullName,
              ...(phoneNumber && { phoneNumber }),
              addressType: AddressType.PRIMARY,
            },
          });
        });
      }

      return await this.prisma.address.create({
        data: {
          ...createAddressInput,
          userId,
          fullName,
          phoneNumber,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This address already exists for the user.',
        );
      }
      throw error;
    }
  }

  async updateAddress(userId: number, updateAddressInput: UpdateAddressInput) {
    const { id, ...data } = updateAddressInput;
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }

    if (
      data.addressType === AddressType.PRIMARY &&
      address.addressType !== AddressType.PRIMARY
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId, addressType: AddressType.PRIMARY },
          data: { addressType: AddressType.SECONDARY },
        });
        await tx.address.update({
          where: { id },
          data,
        });
      });
      return this.prisma.address.findUnique({ where: { id } });
    }

    if (data.fullName === null) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      data.fullName = `${user.firstName} ${user.lastName}`;
    }

    if (data.phoneNumber === null) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      data.phoneNumber = user.phoneNumber;
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
