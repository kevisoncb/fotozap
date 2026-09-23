import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentService } from "../../src/modules/payments/payment.service.js";

const mockPrisma = {
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe("PaymentService", () => {
  let service: PaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentService(mockPrisma);
  });

  it("should create payment with unique external id", async () => {
    mockPrisma.payment.create.mockResolvedValue({
      id: "pay1",
      provider: "mercadopago",
      externalPaymentId: "mp123",
      status: "CREATED",
    });

    const payment = await service.create({
      orderId: "order1",
      provider: "mercadopago",
      externalPaymentId: "mp123",
      amountCents: 299,
    });

    expect(payment.externalPaymentId).toBe("mp123");
    expect(mockPrisma.payment.create).toHaveBeenCalled();
  });

  it("should mark payment as approved idempotently", async () => {
    const existingPayment = {
      id: "pay1",
      status: "PENDING",
      provider: "mercadopago",
      externalPaymentId: "mp123",
    };

    mockPrisma.payment.findUnique.mockResolvedValue(existingPayment);
    mockPrisma.payment.update.mockResolvedValue({
      ...existingPayment,
      status: "APPROVED",
    });

    const approved = await service.markApproved("mercadopago", "mp123", "approved");

    expect(approved?.status).toBe("APPROVED");
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          paidAt: expect.any(Date),
        }),
      }),
    );
  });

  it("should not update already approved payment", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: "pay1",
      status: "APPROVED",
    });

    const result = await service.markApproved("mercadopago", "mp123");

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    expect(result?.status).toBe("APPROVED");
  });

  it("should return null for unknown payment", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(null);

    const result = await service.markApproved("mercadopago", "unknown");

    expect(result).toBeNull();
  });
});
