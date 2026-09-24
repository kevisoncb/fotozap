import { describe, expect, it } from "vitest";
import { loadEnv } from "../../src/config/env.js";

describe("env validation", () => {
  it("allows development without secrets", () => {
    const env = loadEnv({ NODE_ENV: "development" });
    expect(env.WHATSAPP_PROVIDER).toBe("mock");
    expect(env.IMAGE_WORKER_CONCURRENCY).toBe(5);
  });

  it("fails production when database is missing", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow("DATABASE_URL");
  });

  it("prefers Railway PORT over API_PORT", () => {
    const env = loadEnv({ NODE_ENV: "development", PORT: "8080", API_PORT: "3001" });
    expect(env.API_PORT).toBe(8080);
    expect(env.API_HOST).toBe("0.0.0.0");
  });

  it("boots production with placeholder WhatsApp secrets", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://fotozap:fotozap@localhost:5432/fotozap",
      REDIS_URL: "redis://localhost:6379",
      WHATSAPP_PROVIDER: "real",
      WHATSAPP_ACCESS_TOKEN: "aguardando_meta",
      WHATSAPP_PHONE_NUMBER_ID: "aguardando_meta",
      WHATSAPP_VERIFY_TOKEN: "aguardando_meta",
      WHATSAPP_APP_SECRET: "aguardando_meta",
    });

    expect(env.WHATSAPP_PROVIDER).toBe("mock");
    expect(env.API_HOST).toBe("0.0.0.0");
  });
});
