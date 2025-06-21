import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayService {
  constructor(
    private readonly configService: ConfigService,
    public readonly razorpay = new Razorpay({
      key_id: configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: configService.get<string>('RAZORPAY_KEY_SECRET'),
    }),
  ) {}
}
