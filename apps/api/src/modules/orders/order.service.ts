import type { PrismaClient, Order, OrderStatus } from "../../../../../generated/prisma/client.js";
import { canTransitionOrder } from "@fotozap/shared";

export type CreateOrderInput = {
  userId: string;
  productId: string;
  amountCents: number;
  currency?: string;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  newStatus: OrderStatus;
  metadata?: {
    paidAt?: Date;
    processingStartedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    cancelledAt?: Date;
    failureCode?: string;
    failureMessage?: string;
  };
};

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateOrderInput): Promise<Order> {
    return this.prisma.order.create({
      data: {
        userId: input.userId,
        productId: input.productId,
        amountCents: input.amountCents,
        currency: input.currency ?? "BRL",
        status: "CREATED",
      },
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
    });
  }

  async transitionStatus(input: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.findById(input.orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (!canTransitionOrder(order.status, input.newStatus)) {
      throw new Error(`INVALID_ORDER_TRANSITION:${order.status}->${input.newStatus}`);
    }

    return this.prisma.order.update({
      where: { id: input.orderId },
      data: {
        status: input.newStatus,
        ...input.metadata,
        updatedAt: new Date(),
      },
    });
  }

  async findActiveByUser(userId: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: {
        userId,
        status: {
          in: ["CREATED", "AWAITING_PAYMENT", "PAID", "QUEUED", "PROCESSING"],
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async setInputImage(orderId: string, imageKey: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { inputImageKey: imageKey },
    });
  }

  async setOutputImage(orderId: string, imageKey: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { outputImageKey: imageKey },
    });
  }

  async findExpiredPayments(expirationMinutes: number): Promise<Order[]> {
    const cutoff = new Date(Date.now() - expirationMinutes * 60 * 1000);
    return this.prisma.order.findMany({
      where: {
        status: "AWAITING_PAYMENT",
        createdAt: { lt: cutoff },
      },
    });
  }
}
