import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RazorpayService } from '@/payment/razorpay/razorpay.service';
import { PaymentGatewaysService } from '@/payment/payment-gateways/payment-gateways.service';
import { PrismaService } from 'prisma/prisma.service';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private paymentGatewaysService: PaymentGatewaysService,
    private configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        intent: true,
        gateway: true,
        refunds: true,
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        intent: true,
        gateway: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByGatewayPaymentId(gatewayPaymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayPaymentId },
      include: {
        intent: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_WEBHOOK_SECRET'))
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid Razorpay signature.');
    }

    // --- Signature is valid, now create the payment record ---

    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { gatewayIntentId: razorpayOrderId },
      include: { order: true },
    });

    if (!paymentIntent) {
      throw new BadRequestException('Payment Intent not found.');
    }

    const razorpayPayment =
      await this.razorpayService.razorpay.payments.fetch(razorpayPaymentId);

    if (razorpayPayment.status !== 'captured') {
      throw new BadRequestException('Payment not captured on Razorpay.');
    }

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        intentId: paymentIntent.id,
        gatewayId: paymentIntent.gatewayId,
        gatewayPaymentId: razorpayPaymentId,
        userEmail: paymentIntent.userEmail,
        status: 'success',
        amount: Number(razorpayPayment.amount),
        currency: razorpayPayment.currency,
        metadata: JSON.parse(JSON.stringify(razorpayPayment)),
      },
    });

    // Update the payment intent status
    await this.prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: 'PAID' },
    });

    // Update the order status
    await this.prisma.order.update({
      where: { id: paymentIntent.orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    return payment;
  }

  async handleRazorpayWebhook(signature: string, body: any) {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid Razorpay webhook signature.');
    }

    // --- Signature is valid, now process the event ---
    const event = body;

    if (event.event === 'payment.captured') {
      const razorpayPayment = event.payload.payment.entity;

      // --- Idempotency Check ---
      const existingPayment = await this.prisma.payment.findUnique({
        where: { gatewayPaymentId: razorpayPayment.id },
      });

      if (existingPayment) {
        console.log(`Payment ${razorpayPayment.id} already processed.`);
        return { received: true };
      }

      const paymentIntent = await this.prisma.paymentIntent.findUnique({
        where: { gatewayIntentId: razorpayPayment.order_id },
      });

      if (!paymentIntent) {
        throw new BadRequestException('Payment Intent not found for webhook.');
      }

      // Create the payment record
      const payment = await this.prisma.payment.create({
        data: {
          intentId: paymentIntent.id,
          gatewayId: paymentIntent.gatewayId,
          gatewayPaymentId: razorpayPayment.id,
          userEmail: paymentIntent.userEmail,
          status: 'success',
          amount: Number(razorpayPayment.amount),
          currency: razorpayPayment.currency,
          metadata: JSON.parse(JSON.stringify(razorpayPayment)),
        },
      });

      // Update the payment intent status
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'PAID' },
      });

      // Update the order status
      await this.prisma.order.update({
        where: { id: paymentIntent.orderId },
        data: { status: OrderStatus.PROCESSING },
      });

      console.log(`Successfully processed payment ${payment.id} via webhook.`);
    }

    return { received: true };
  }

  async syncPaymentStatusFromRazorpay(paymentId: string) {
    this.logger.log(`Syncing payment status for payment ID: ${paymentId}`);

    // Find the payment in our database
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        intent: {
          include: {
            order: true,
          },
        },
        gateway: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    try {
      // Fetch latest status from Razorpay
      const razorpayPayment = await this.razorpayService.getPaymentStatus(
        payment.gatewayPaymentId,
      );

      // Map Razorpay status to our status
      const newStatus = this.mapRazorpayStatusToOurStatus(
        razorpayPayment.status,
      );

      // Check if status has changed
      if (payment.status === newStatus) {
        this.logger.log(`Payment ${paymentId} status unchanged: ${newStatus}`);
        return {
          payment,
          statusChanged: false,
          previousStatus: payment.status,
          currentStatus: newStatus,
        };
      }

      // Update payment status in database
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          metadata: JSON.parse(JSON.stringify(razorpayPayment)),
          updatedAt: new Date(),
        },
        include: {
          intent: {
            include: {
              order: true,
            },
          },
          gateway: true,
        },
      });

      // Update payment intent and order status based on payment status
      await this.updateRelatedEntitiesStatus(
        updatedPayment,
        razorpayPayment.status,
      );

      this.logger.log(
        `Payment ${paymentId} status updated from ${payment.status} to ${newStatus}`,
      );

      return {
        payment: updatedPayment,
        statusChanged: true,
        previousStatus: payment.status,
        currentStatus: newStatus,
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync payment status for ${paymentId}:`,
        error,
      );
      throw new BadRequestException(
        `Failed to sync payment status: ${error.message}`,
      );
    }
  }

  async syncPaymentStatusByGatewayId(gatewayPaymentId: string) {
    this.logger.log(
      `Syncing payment status for Razorpay payment ID: ${gatewayPaymentId}`,
    );

    // Find the payment by gateway payment ID
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayPaymentId },
      include: {
        intent: {
          include: {
            order: true,
          },
        },
        gateway: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with Razorpay ID ${gatewayPaymentId} not found`,
      );
    }

    return this.syncPaymentStatusFromRazorpay(payment.id);
  }

  async syncOrderPaymentsStatus(orderId: number) {
    this.logger.log(`Syncing all payment statuses for order ID: ${orderId}`);

    // Find the order and its payment intents
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentIntents: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const syncResults = [];

    // Sync status for all payments related to this order
    for (const intent of order.paymentIntents) {
      try {
        // Fetch all payments from Razorpay for this order
        const razorpayPayments = await this.razorpayService.getOrderPayments(
          intent.gatewayIntentId,
        );

        this.logger.log(
          `Found ${razorpayPayments.items.length} payments in Razorpay for order ${intent.gatewayIntentId}`,
        );

        // Process each Razorpay payment
        for (const razorpayPayment of razorpayPayments.items) {
          try {
            // Check if we already have this payment in our database
            const existingPayment = await this.prisma.payment.findUnique({
              where: { gatewayPaymentId: razorpayPayment.id },
            });

            if (existingPayment) {
              // Sync existing payment
              const result = await this.syncPaymentStatusFromRazorpay(
                existingPayment.id,
              );
              syncResults.push(result);
            } else {
              // Create new payment record for Razorpay payment we don't have
              const newPayment = await this.createPaymentFromRazorpay(
                intent,
                razorpayPayment,
              );
              syncResults.push({
                payment: newPayment,
                statusChanged: true,
                previousStatus: 'not_found',
                currentStatus: this.mapRazorpayStatusToOurStatus(
                  razorpayPayment.status,
                ),
              });
              this.logger.log(
                `Created new payment record for Razorpay payment ${razorpayPayment.id}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to process Razorpay payment ${razorpayPayment.id}:`,
              error,
            );
            syncResults.push({
              payment: null,
              statusChanged: false,
              error: error.message,
              gatewayPaymentId: razorpayPayment.id,
            });
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch Razorpay payments for intent ${intent.gatewayIntentId}:`,
          error,
        );

        // Fallback: sync existing payments in our DB
        for (const payment of intent.payments) {
          try {
            const result = await this.syncPaymentStatusFromRazorpay(payment.id);
            syncResults.push(result);
          } catch (syncError) {
            this.logger.error(
              `Failed to sync payment ${payment.id} for order ${orderId}:`,
              syncError,
            );
            syncResults.push({
              payment,
              statusChanged: false,
              error: syncError.message,
            });
          }
        }
      }
    }

    return {
      orderId,
      totalPayments: syncResults.length,
      syncResults,
    };
  }

  private mapRazorpayStatusToOurStatus(razorpayStatus: string): string {
    const statusMap: Record<string, string> = {
      created: 'pending',
      authorized: 'pending',
      captured: 'success',
      failed: 'failed',
      refunded: 'refunded',
    };

    return (
      statusMap[razorpayStatus.toLowerCase()] || razorpayStatus.toLowerCase()
    );
  }

  private async updateRelatedEntitiesStatus(
    payment: any,
    razorpayStatus: string,
  ) {
    // Update payment intent status
    let intentStatus = payment.intent.status;
    if (razorpayStatus === 'captured' && intentStatus !== 'PAID') {
      intentStatus = 'PAID';
      await this.prisma.paymentIntent.update({
        where: { id: payment.intentId },
        data: { status: intentStatus },
      });
    } else if (razorpayStatus === 'failed' && intentStatus !== 'FAILED') {
      intentStatus = 'FAILED';
      await this.prisma.paymentIntent.update({
        where: { id: payment.intentId },
        data: { status: intentStatus },
      });
    }

    // Update order status based on payment status
    let orderStatus = payment.intent.order.status;
    if (razorpayStatus === 'captured' && orderStatus === OrderStatus.PENDING) {
      orderStatus = OrderStatus.PROCESSING;
      await this.prisma.order.update({
        where: { id: payment.intent.orderId },
        data: { status: orderStatus },
      });
    } else if (
      razorpayStatus === 'failed' &&
      orderStatus === OrderStatus.PENDING
    ) {
      orderStatus = OrderStatus.CANCELLED;
      await this.prisma.order.update({
        where: { id: payment.intent.orderId },
        data: { status: orderStatus },
      });
    }

    this.logger.log(
      `Updated related entities - Intent: ${intentStatus}, Order: ${orderStatus}`,
    );
  }

  async syncAllPendingPayments() {
    this.logger.log('Starting bulk sync of all pending payments');

    // Find all payments with pending status
    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: {
          in: ['pending', 'created', 'authorized'],
        },
      },
      include: {
        intent: {
          include: {
            order: true,
          },
        },
        gateway: true,
      },
    });

    this.logger.log(`Found ${pendingPayments.length} pending payments to sync`);

    const syncResults = [];

    for (const payment of pendingPayments) {
      try {
        const result = await this.syncPaymentStatusFromRazorpay(payment.id);
        syncResults.push(result);
      } catch (error) {
        this.logger.error(`Failed to sync payment ${payment.id}:`, error);
        syncResults.push({
          payment,
          statusChanged: false,
          error: error.message,
        });
      }
    }

    const successfulSyncs = syncResults.filter((r) => r.statusChanged).length;
    const failedSyncs = syncResults.filter((r) => r.error).length;

    this.logger.log(
      `Bulk sync completed: ${successfulSyncs} successful, ${failedSyncs} failed, ${syncResults.length} total`,
    );

    return {
      totalPayments: pendingPayments.length,
      successfulSyncs,
      failedSyncs,
      syncResults,
    };
  }

  async checkOrderAccess(orderId: number, userEmail: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order.user.email === userEmail;
  }

  private async createPaymentFromRazorpay(intent: any, razorpayPayment: any) {
    this.logger.log(
      `Creating new payment record for Razorpay payment ${razorpayPayment.id}`,
    );

    // Map Razorpay status to our status
    const ourStatus = this.mapRazorpayStatusToOurStatus(razorpayPayment.status);

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        intentId: intent.id,
        gatewayId: intent.gatewayId,
        gatewayPaymentId: razorpayPayment.id,
        userEmail: intent.userEmail,
        status: ourStatus,
        amount: Number(razorpayPayment.amount),
        currency: razorpayPayment.currency,
        metadata: JSON.parse(JSON.stringify(razorpayPayment)),
      },
      include: {
        intent: {
          include: {
            order: true,
          },
        },
        gateway: true,
        refunds: true,
      },
    });

    // Update related entities based on the payment status
    await this.updateRelatedEntitiesStatus(payment, razorpayPayment.status);

    this.logger.log(
      `Successfully created payment ${payment.id} for Razorpay payment ${razorpayPayment.id}`,
    );

    return payment;
  }

  //   async verifyAndProcessPayment(params: {
  //     gatewayPaymentId: string;
  //     gatewaySignature?: string;
  //     metadata?: Record<string, any>;
  //   }) {
  //     const { gatewayPaymentId, gatewaySignature, metadata } = params;

  //     // Check if payment already processed

  //     const existingPayment = await this.findByGatewayPaymentId(gatewayPaymentId);
  //     if (existingPayment) {
  //     }

  //     // Get payment details from gateway
  //     const gatewayPayment =
  //       await this.razorpayService.getPaymentDetails(gatewayPaymentId);

  //     if (!gatewayPayment) {
  //       throw new BadRequestException('Invalid payment ID');
  //     }

  //     // Verify payment intent exists
  //     const intent = await this.prisma.paymentIntent.findUnique({
  //       where: { gatewayIntentId: gatewayPayment.order_id },
  //       include: { gateway: true },
  //     });

  //     if (!intent) {
  //       throw new BadRequestException('Invalid payment intent');
  //     }

  //     // Verify payment details match intent
  //     if (
  //       gatewayPayment.amount !== intent.amount ||
  //       gatewayPayment.currency !== intent.currency
  //     ) {
  //       throw new BadRequestException('Payment details mismatch');
  //     }

  //     // Create payment record
  //     const payment = await this.prisma.payment.create({
  //       data: {
  //         intentId: intent.id,
  //         gatewayId: intent.gatewayId,
  //         gatewayPaymentId,
  //         userEmail: intent.userEmail,
  //         status: PAYMENT_STATUS.AUTHORIZED,
  //         amount: gatewayPayment.amount,
  //         currency: gatewayPayment.currency,
  //         metadata: {
  //           ...metadata,
  //           gatewayResponse: gatewayPayment,
  //         } as any,
  //       },
  //       include: {
  //         intent: true,
  //       },
  //     });

  //     return payment;
  //   }

  //   async initiateRefund(params: {
  //     paymentId: string;
  //     amount: number;
  //     metadata?: Record<string, any>;
  //   }) {
  //     const { paymentId, amount, metadata } = params;

  //     const payment = await this.findOne(paymentId);

  //     // Verify payment can be refunded
  //     if (payment.status !== 'success') {
  //       throw new BadRequestException('Payment cannot be refunded');
  //     }

  //     if (payment.amountRefunded + amount > payment.amount) {
  //       throw new BadRequestException('Refund amount exceeds payment amount');
  //     }

  //     // Process refund with gateway
  //     const gatewayRefund = await this.razorpayService.initiateRefund({
  //       paymentId: payment.gatewayPaymentId,
  //       amount,
  //       notes: metadata,
  //     });

  //     // Create refund record
  //     const refund = await this.prisma.refund.create({
  //       data: {
  //         paymentId: payment.id,
  //         gatewayId: payment.gatewayId,
  //         gatewayRefundId: gatewayRefund.id,
  //         amount,
  //         currency: payment.currency,
  //         status: 'processing',
  //         metadata: {
  //           ...metadata,
  //           gatewayResponse: gatewayRefund,
  //         } as any,
  //       },
  //     });

  //     // Update payment status and refunded amount
  //     await this.prisma.payment.update({
  //       where: { id: payment.id },
  //       data: {
  //         amountRefunded: payment.amountRefunded + amount,
  //         status:
  //           payment.amountRefunded + amount === payment.amount
  //             ? 'refunded'
  //             : 'partially_refunded',
  //       },
  //     });

  //     return refund;
  //   }

  //   private mapGatewayStatus(gatewayStatus: string): string {
  //     // Map gateway-specific status to our standard statuses
  //     const statusMap: Record<string, string> = {
  //       created: 'pending',
  //       authorized: 'pending',
  //       captured: 'success',
  //       failed: 'failed',
  //       refunded: 'refunded',
  //     };

  //     return (
  //       statusMap[gatewayStatus.toLowerCase()] || gatewayStatus.toLowerCase()
  //     );
  //   }
}
