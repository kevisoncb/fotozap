import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookService } from "../../src/modules/webhooks/webhook.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = {
  webhookEvent: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe("WebhookService", () => {
  let service: WebhookService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WebhookService(mockPrisma);
  });

  it("should record new webhook event", async () => {
    mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
    mockPrisma.webhookEvent.create.mockResolvedValue({
      id: "evt1",
      provider: "mercadopago",
      externalEventId: "mp-evt-123",
      status: "RECEIVED",
    });

    const event = await service.recordEvent({
      provider: "mercadopago",
      externalEventId: "mp-evt-123",
      eventType: "payment.updated",
      payload: { id: "mp-evt-123", status: "approved" },
    });

    expect(event).not.toBeNull();
    expect(event?.status).toBe("RECEIVED");
  });

  it("should reject duplicate webhook event", async () => {
    mockPrisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt1",
      status: "PROCESSED",
    });
    mockPrisma.webhookEvent.update.mockResolvedValue({});

    const event = await service.recordEvent({
      provider: "mercadopago",
      externalEventId: "mp-evt-123",
      eventType: "payment.updated",
      payload: { id: "mp-evt-123" },
    });

    expect(event).toBeNull();
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "DUPLICATE" },
      }),
    );
  });

  it("should mark event as processed with timestamp", async () => {
    mockPrisma.webhookEvent.update.mockResolvedValue({});

    await service.markProcessed("evt1");

    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: "evt1" },
      data: {
        status: "PROCESSED",
        processedAt: expect.any(Date),
      },
    });
  });
});
