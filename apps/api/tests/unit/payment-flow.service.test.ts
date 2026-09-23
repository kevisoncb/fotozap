import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentFlowService } from "../../src/modules/payment/payment-flow.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = {
  product: {
    findUnique: vi.fn(),
  },
} as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPaymentProvider = {
  createPix: vi.fn(),
  getPaymentStatus: vi.fn(),
  validateWebhookSignature: vi.fn(),
} as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPaymentService = {
  create: vi.fn(),
  findByExternalId: vi.fn(),
  markApproved: vi.fn(),
} as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOrderService = {
  findById: vi.fn(),
  transitionStatus: vi.fn(),
} as any;

describe("PaymentFlowService", () => {
  let service: PaymentFlowService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentFlowService(
      mockPrisma,
      mockPaymentProvider,
      mockPaymentService,
      mockOrderService,
      30,
    );
  });

  it("should create Pix for order", async () => {
    const order = {
      id: "order123",
      userId: "user1",
      productId: "prod1",
      status: "PENDING_PAYMENT",
      amountCents: 5000,
      currency: "BRL",
    };

    const product = {
      id: "prod1",
      name: "Test Product",
    };

    mockOrderService.findById.mockResolvedValue(order);
    mockPrisma.product.findUnique.mockResolvedValue(product);
    mockPaymentProvider.createPix.mockResolvedValue({
      externalPaymentId: "mp123",
      pixCode: "pix_code_here",
      pixQrCodeUrl: "https://qr.local",
      expiresAt: new Date("2026-09-23T12:00:00Z"),
    });

    const result = await service.createPixForOrder("order123");

    expect(result.pixCode).toBe("pix_code_here");
    expect(result.pixQrCodeUrl).toBe("https://qr.local");
    expect(mockPaymentService.create).toHaveBeenCalledWith({
      orderId: "order123",
      externalPaymentId: "mp123",
      method: "PIX",
      status: "PENDING",
      amountCents: 5000,
      currency: "BRL",
      expiresAt: expect.any(Date),
      metadata: {
        pixCode: "pix_code_here",
        pixQrCodeUrl: "https://qr.local",
      },
    });
  });

  it("should reject if order status is invalid", async () => {
    mockOrderService.findById.mockResolvedValue({
      id: "order123",
      status: "COMPLETED",
    });

    await expect(service.createPixForOrder("order123")).rejects.toThrow(
      "ORDER_INVALID_STATUS:COMPLETED",
    );
  });

  it("should handle payment approved", async () => {
    mockPaymentService.findByExternalId.mockResolvedValue({
      id: "pay123",
      orderId: "order123",
    });
    mockPaymentService.markApproved.mockResolvedValue(true);

    await service.handlePaymentApproved("mp123");

    expect(mockPaymentService.markApproved).toHaveBeenCalledWith("pay123");
    expect(mockOrderService.transitionStatus).toHaveBeenCalledWith("order123", "PAID");
  });

  it("should be idempotent for already approved payment", async () => {
    mockPaymentService.findByExternalId.mockResolvedValue({
      id: "pay123",
      orderId: "order123",
    });
    mockPaymentService.markApproved.mockResolvedValue(false);

    await service.handlePaymentApproved("mp123");

    expect(mockOrderService.transitionStatus).not.toHaveBeenCalled();
  });
});
