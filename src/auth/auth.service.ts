import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: any): Promise<any> {
    const { name, emails, photos, id, provider } = profile;

    const email = emails[0].value;

    let user = await this.userService.findUserByEmail(email).catch(() => null);

    if (!user) {
      user = await this.userService.create({
        email: email,
        firstName: name.givenName,
        lastName: name.familyName,
        authAccounts: {
          create: {
            oauthProvider: provider,
            oauthId: id,
          },
        },
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
