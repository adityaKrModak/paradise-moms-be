import { IsEmail, IsNotEmpty } from 'class-validator';

export class createUserDto {
  @IsNotEmpty()
  username: string;
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
