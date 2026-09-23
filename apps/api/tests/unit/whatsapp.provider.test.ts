import { describe, it, expect } from "vitest";
import { MockWhatsAppProvider } from "../../src/providers/whatsapp/mock.provider.js";

describe("MockWhatsAppProvider", () => {
  it("should send text message", async () => {
    const provider = new MockWhatsAppProvider();

    const result = await provider.sendText("+5511999999999", "Hello");

    expect(result.messageId).toMatch(/^mock_msg_/);
  });

  it("should verify webhook with correct token", () => {
    const provider = new MockWhatsAppProvider();

    const result = provider.verifyWebhook("subscribe", "mock_verify_token", "challenge123");

    expect(result).toBe("challenge123");
  });

  it("should reject webhook with wrong token", () => {
    const provider = new MockWhatsAppProvider();

    const result = provider.verifyWebhook("subscribe", "wrong_token", "challenge123");

    expect(result).toBeNull();
  });

  it("should always validate signature in mock mode", () => {
    const provider = new MockWhatsAppProvider();

    const result = provider.validateWebhookSignature("any_signature", "any_body");

    expect(result).toBe(true);
  });

  it("should send image message", async () => {
    const provider = new MockWhatsAppProvider();

    const result = await provider.sendImage("+5511999999999", "https://example.com/img.jpg", "Caption");

    expect(result.messageId).toMatch(/^mock_msg_/);
  });

  it("should download media", async () => {
    const provider = new MockWhatsAppProvider();

    const result = await provider.downloadMedia("media123");

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe("image/jpeg");
  });
});
