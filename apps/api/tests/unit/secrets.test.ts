import { describe, expect, it } from "vitest";
import { hasUsableSecrets, isPlaceholderSecret } from "../../src/config/secrets.js";
import { createWhatsAppProvider } from "../../src/providers/whatsapp/factory.js";
import { MockWhatsAppProvider } from "../../src/providers/whatsapp/mock.provider.js";

describe("placeholder secrets", () => {
  it("treats aguardando_meta as unusable", () => {
    expect(isPlaceholderSecret("aguardando_meta")).toBe(true);
    expect(hasUsableSecrets("aguardando_meta", "aguardando_meta")).toBe(false);
  });

  it("accepts real-looking tokens", () => {
    expect(isPlaceholderSecret("EAABsbCS1iHgBO7xYz")).toBe(false);
    expect(hasUsableSecrets("EAABsbCS1iHgBO7xYz")).toBe(true);
  });

  it("does not crash WhatsApp factory with placeholder Meta tokens", () => {
    const provider = createWhatsAppProvider("real", {
      accessToken: "aguardando_meta",
      phoneNumberId: "aguardando_meta",
      verifyToken: "aguardando_meta",
      appSecret: "aguardando_meta",
    });

    expect(provider).toBeInstanceOf(MockWhatsAppProvider);
  });
});
