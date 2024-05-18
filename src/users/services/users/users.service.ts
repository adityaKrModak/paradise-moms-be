import { Injectable } from '@nestjs/common';
import { createUserDto } from 'src/users/controllers/users/tdos/CreateUser.dto';

@Injectable()
export class UsersService {
  private fakeUsers = [{ username: 'ankur', email: 'ankur@gmail.com' }];
  ferchUsers() {
    return this.fakeUsers;
  }

  createUsers(userDetails: createUserDto) {
    this.fakeUsers.push(userDetails);
    return;
  }

   
}
