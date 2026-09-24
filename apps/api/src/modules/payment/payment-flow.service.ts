import type { Queue } from "bullmq";
import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import type { IPaymentProvider } from "../../providers/payment/payment.provider.interface.js";
import type { PaymentService } from "../payments/payment.service.js";
import type { OrderService } from "../orders/order.service.js";
import type { GenerationJobData } from "../../queues/generation.queue.js";

export class PaymentFlowService {
  constructor(
    private prisma: PrismaClient,
    private paymentProvider: IPaymentProvider,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private expirationMinutes: number,
    private generationQueue?: Queue<GenerationJobData>,
  ) {}

  async createPixForOrder(orderId: string): Promise<{
    pixCode: string;
    pixQrCodeUrl: string;
    expiresAt: Date;
  }> {
    const order = await this.orderService.findById(orderId);

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status !== "AWAITING_PAYMENT") {
      throw new Error(`ORDER_INVALID_STATUS:${order.status}`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: order.productId },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const pixResult = await this.paymentProvider.createPix({
      orderId: order.id,
      amountCents: order.amountCents,
      currency: order.currency,
      description: product.name,
      expirationMinutes: this.expirationMinutes,
    });

    await this.paymentService.create({
      orderId: order.id,
      externalPaymentId: pixResult.externalPaymentId,
      provider: this.paymentProvider.constructor.name.toLowerCase().replace('provider', ''),
      status: "PENDING",
      amountCents: order.amountCents,
      currency: order.currency,
      expiresAt: pixResult.expiresAt,
      pixCode: pixResult.pixCode,
      pixQrCodeUrl: pixResult.pixQrCodeUrl,
    });

    return {
      pixCode: pixResult.pixCode,
      pixQrCodeUrl: pixResult.pixQrCodeUrl,
      expiresAt: pixResult.expiresAt,
    };
  }

  async handlePaymentApproved(externalPaymentId: string): Promise<void> {
    const payment = await this.paymentService.findByExternalId(externalPaymentId);

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    const changed = await this.paymentService.markApproved(payment.id);

    if (!changed) {
      // Already processed (idempotent)
      return;
    }

    await this.orderService.transitionStatus({
      orderId: payment.orderId,
      newStatus: "PAID",
    });

    // Enqueue generation job if queue available
    if (this.generationQueue) {
      const order = await this.orderService.findById(payment.orderId);

      if (order) {
        await this.generationQueue.add(
          `generation-${order.id}`,
          {
            orderId: order.id,
            userId: order.userId,
            productId: order.productId,
          },
          {
            jobId: `gen-${order.id}`,
          },
        );

        console.log(`[PaymentFlow] Enqueued generation job for order ${order.id}`);
      }
    }
  }
}
