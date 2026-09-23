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
});
