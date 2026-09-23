import { describe, it, expect, beforeEach } from "vitest";
import { MockPaymentProvider } from "../../src/providers/payment/mock.provider.js";

describe("MockPaymentProvider", () => {
  let provider: MockPaymentProvider;

  beforeEach(() => {
    provider = new MockPaymentProvider();
  });

  it("should create Pix payment", async () => {
    const result = await provider.createPix({
      orderId: "order123",
      amountCents: 5000,
      currency: "BRL",
      description: "Test product",
      expirationMinutes: 30,
    });

    expect(result.externalPaymentId).toContain("mock_payment_");
    expect(result.pixCode).toContain("br.gov.bcb.pix");
    expect(result.pixQrCodeUrl).toContain("https://mock-payment.local");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("should return pending status initially", async () => {
    const result = await provider.createPix({
      orderId: "order123",
      amountCents: 5000,
      currency: "BRL",
      description: "Test",
      expirationMinutes: 30,
    });

    const status = await provider.getPaymentStatus(result.externalPaymentId);

    expect(status).toBe("pending");
  });

  it("should validate webhook signature (mock always true)", () => {
    const valid = provider.validateWebhookSignature("sig", "body", "secret");

    expect(valid).toBe(true);
  });

  it(
    "should auto-approve payment after delay",
    async () => {
      const result = await provider.createPix({
        orderId: "order123",
        amountCents: 5000,
        currency: "BRL",
        description: "Test",
        expirationMinutes: 30,
      });

      // Wait for auto-approval (5 seconds in mock)
      await new Promise((resolve) => setTimeout(resolve, 5100));

      const status = await provider.getPaymentStatus(result.externalPaymentId);

      expect(status).toBe("approved");
    },
    10000,
  ); // 10 second timeout
});
