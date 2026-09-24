import type {
  PrismaClient,
  Payment,
  PaymentStatus,
} from "@prisma/client";

export type CreatePaymentInput = {
  orderId: string;
  provider: string;
  externalPaymentId: string;
  status?: PaymentStatus;
  amountCents: number;
  currency?: string;
  pixCode?: string;
  pixQrCodeUrl?: string;
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
        status: input.status ?? "CREATED",
        pixCopyPaste: input.pixCopyPaste ?? input.pixCode,
        pixQrCodeBase64: input.pixQrCodeBase64 ?? input.pixQrCodeUrl,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByExternalId(externalId: string, provider?: string): Promise<Payment | null> {
    if (provider) {
      return this.prisma.payment.findUnique({
        where: {
          provider_externalPaymentId: {
            provider,
            externalPaymentId: externalId,
          },
        },
      });
    }
    return this.prisma.payment.findFirst({
      where: { externalPaymentId: externalId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(paymentId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
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

  async markApproved(paymentId: string, rawStatus?: string): Promise<boolean> {
    const payment = await this.findById(paymentId);
    if (!payment || payment.status === "APPROVED") {
      return false;
    }

    await this.updateStatus(payment.id, "APPROVED", rawStatus);
    return true;
  }
}
