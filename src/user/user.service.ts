import { Injectable } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto.ts';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  //   constructor(private prisma: PrismaService) {}
  //   async createUser(createUserDto: CreateUserDto) {
  //     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  //     return this.prisma.user.create({
  //       data: {
  //         ...createUserDto,
  //         password: hashedPassword,
  //       },
  //     });
  //   }
  //   async findUserByEmail(email: string) {
  //     return this.prisma.user.findUnique({
  //       where: { email },
  //     });
  //   }
}
