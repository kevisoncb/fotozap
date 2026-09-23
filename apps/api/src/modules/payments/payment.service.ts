import type {
  PrismaClient,
  Payment,
  PaymentStatus,
} from "../../../../../generated/prisma/client.js";

export type CreatePaymentInput = {
  orderId: string;
  provider: string;
  externalPaymentId: string;
  amountCents: number;
  currency?: string;
  pixCopyPaste?: string;
  pixQrCodeBase64?: string;
  expiresAt?: Date;
};

export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePaymentInput): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        externalPaymentId: input.externalPaymentId,
        amountCents: input.amountCents,
        currency: input.currency ?? "BRL",
        status: "CREATED",
        pixCopyPaste: input.pixCopyPaste,
        pixQrCodeBase64: input.pixQrCodeBase64,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByExternalId(provider: string, externalId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: {
        provider_externalPaymentId: {
          provider,
          externalPaymentId: externalId,
        },
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    rawStatus?: string,
  ): Promise<Payment> {
    const data: {
      status: PaymentStatus;
      rawStatus?: string;
      paidAt?: Date;
      updatedAt: Date;
    } = {
      status,
      updatedAt: new Date(),
    };

    if (rawStatus) {
      data.rawStatus = rawStatus;
    }

    if (status === "APPROVED" || status === "REFUNDED") {
      data.paidAt = new Date();
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data,
    });
  }

  async markApproved(
    provider: string,
    externalId: string,
    rawStatus?: string,
  ): Promise<Payment | null> {
    const payment = await this.findByExternalId(provider, externalId);
    if (!payment) {
      return null;
    }

    if (payment.status === "APPROVED") {
      return payment;
    }

    return this.updateStatus(payment.id, "APPROVED", rawStatus);
  }
}
