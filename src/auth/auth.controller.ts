import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google')) // AuthGuard intercept the request, This will trigger the GoogleStrategy and redirect to Google's OAuth 2.0 consent screen for authentication.
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // When redirected google will call this with code query params and the GoogleStrategy will call the validate method now because it knows now that code query param is there.
  async googleAuthRedirect(@Req() req) {
    console.log(req);
    return req.user;
  }
}
