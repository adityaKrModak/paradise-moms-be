import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Request as ExpressRequest } from 'express';

// Add interface to extend Express Request
interface RequestWithUser extends ExpressRequest {
  user: any; // Or define a more specific type for your user
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: RequestWithUser, @Res() res: Response) {
    try {
      const jwt = req.user;
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${jwt.accessToken}`,
      );
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    } // This will now be the JWT
  }
}
