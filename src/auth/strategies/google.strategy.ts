import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
//a strategy is a module or a class that handles the process of verifying the credentials of a user.
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    //super is used to call the constructor of the parent class(PassportStrategy)
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/auth/google/callback`, // the url that google will redirect to after the user logs in after they have authenticated
      scope: ['email', 'profile'], //This specifies the access you are requesting from the user.  In this case, email and profile allow you to get the user’s email address and basic profile information.
      // access_type: 'offline', //This specifies that you want to get a refresh token from Google. This is useful when you want to access the user’s data when they are not logged in.
      prompt: 'consent', //This specifies that you want the user to consent to the access you are requesting.
    });
  }
  //When a method in the child class has the same name as a method in the parent class, it overrides the parent method.
  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
    };
  }
  //When a method in the child class has the same name as a method in the parent class, it overrides the parent method.
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const jwt = await this.authService.validateOAuthLogin(profile);
      done(null, jwt);
    } catch (err) {
      done(err, null);
    }
  }
}
