import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrderService } from "../../src/modules/orders/order.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = {
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
} as any;

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrderService(mockPrisma);
  });

  it("should create order with default currency", async () => {
    mockPrisma.order.create.mockResolvedValue({
      id: "order1",
      status: "CREATED",
      amountCents: 299,
      currency: "BRL",
    });

    const order = await service.create({
      userId: "user1",
      productId: "prod1",
      amountCents: 299,
    });

    expect(order.currency).toBe("BRL");
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CREATED",
          amountCents: 299,
        }),
      }),
    );
  });

  it("should allow valid status transition", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: "order1",
      status: "AWAITING_PAYMENT",
    });
    mockPrisma.order.update.mockResolvedValue({
      id: "order1",
      status: "PAID",
    });

    const updated = await service.transitionStatus({
      orderId: "order1",
      newStatus: "PAID",
      metadata: { paidAt: new Date() },
    });

    expect(updated.status).toBe("PAID");
  });

  it("should reject invalid status transition", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: "order1",
      status: "COMPLETED",
    });

    await expect(
      service.transitionStatus({
        orderId: "order1",
        newStatus: "PROCESSING",
      }),
    ).rejects.toThrow("INVALID_ORDER_TRANSITION");
  });

  it("should find expired awaiting payments", async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    mockPrisma.order.findMany.mockResolvedValue([
      { id: "order1", status: "AWAITING_PAYMENT", createdAt: cutoff },
    ]);

    const expired = await service.findExpiredPayments(30);

    expect(expired).toHaveLength(1);
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "AWAITING_PAYMENT",
        }),
      }),
    );
  });
});
