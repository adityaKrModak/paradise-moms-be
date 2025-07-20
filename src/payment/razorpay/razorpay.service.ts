import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayService {
  public readonly razorpay: Razorpay;
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      this.logger.log(
        `Fetched payment status for ${paymentId}: ${payment.status}`,
      );
      return payment;
    } catch (error) {
      this.logger.error(`Failed to fetch payment ${paymentId}:`, error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      this.logger.log(`Fetched order status for ${orderId}: ${order.status}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderPayments(orderId: string) {
    try {
      const payments = await this.razorpay.orders.fetchPayments(orderId);
      this.logger.log(
        `Fetched ${payments.items.length} payments for order ${orderId}`,
      );
      return payments;
    } catch (error) {
      this.logger.error(
        `Failed to fetch payments for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }
}
