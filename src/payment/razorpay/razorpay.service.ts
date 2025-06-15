import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PaymentGatewaysService } from '@/payment/payment-gateways/payment-gateways.service';
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from 'razorpay/dist/utils/razorpay-utils';

@Injectable()
export class RazorpayService {
  private razorpayInstance: Razorpay | null = null;
  private gateway: any = null;

  constructor(private paymentGatewaysService: PaymentGatewaysService) {}

  private async getRazorpayInstance() {
    try {
      if (this.razorpayInstance) {
        return this.razorpayInstance;
      }

      this.gateway = await this.paymentGatewaysService.findByName('razorpay');

      if (!this.gateway || !this.gateway.isActive) {
        throw new Error('Razorpay gateway not found or inactive');
      }

      this.razorpayInstance = new Razorpay({
        key_id: this.gateway.config.key_id,
        key_secret: this.gateway.config.key_secret,
      });

      return this.razorpayInstance;
    } catch (error) {
      console.error('Failed to initialize Razorpay:', error);
      throw error;
    }
  }

  private async getGatewayConfig() {
    try {
      if (this.gateway) {
        return this.gateway;
      }
      this.gateway = await this.paymentGatewaysService.findByName('razorpay');

      if (!this.gateway || !this.gateway.isActive) {
        throw new Error('Razorpay gateway not found or inactive');
      }
      return this.gateway;
    } catch (error) {
      console.error('Failed to get Razorpay config:', error);
      throw error;
    }
  }

  async createOrder(params: {
    amount: number;
    currency: string;
    notes?: Record<string, any>;
  }) {
    const razorpay = await this.getRazorpayInstance();
    return razorpay.orders.create({
      amount: params.amount,
      currency: params.currency,
      notes: params.notes || {},
    });
  }

  async verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    const gateway = await this.getGatewayConfig();
    return validatePaymentVerification(
      {
        order_id: params.orderId,
        payment_id: params.paymentId,
      },
      params.signature,
      gateway.config.key_secret,
    );
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const gateway = await this.getGatewayConfig();

      if (gateway?.is_active) {
        throw new Error('Razorpay gateway is not active');
      }

      return validateWebhookSignature(
        payload,
        signature,
        gateway.config?.webhook_secret,
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    const razorpay = await this.getRazorpayInstance();
    return razorpay.payments.fetch(paymentId);
  }

  async initiateRefund(params: {
    paymentId: string;
    amount: number;
    notes?: Record<string, any>;
  }) {
    const razorpay = await this.getRazorpayInstance();
    return razorpay.payments.refund(params.paymentId, {
      amount: params.amount,
      notes: params.notes,
    });
  }
}
