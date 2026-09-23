import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter } from "../../src/middleware/rate-limit.js";
import Redis from "ioredis-mock";

describe("RateLimiter", () => {
  let redis: Redis;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    redis = new Redis();
    rateLimiter = new RateLimiter(redis as any, {
      maxMessagesPerMinute: 3,
      maxUploadsPerHour: 2,
      maxGenerationsPerHour: 2,
      maxOrdersPerHour: 2,
    });
  });

  afterEach(async () => {
    await redis.flushall();
    redis.disconnect();
  });

  describe("checkMessages", () => {
    it("should allow requests within limit", async () => {
      const result1 = await rateLimiter.checkMessages("5511999999999");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = await rateLimiter.checkMessages("5511999999999");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await rateLimiter.checkMessages("5511999999999");
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests exceeding limit", async () => {
      await rateLimiter.checkMessages("5511999999999");
      await rateLimiter.checkMessages("5511999999999");
      await rateLimiter.checkMessages("5511999999999");

      const result4 = await rateLimiter.checkMessages("5511999999999");
      expect(result4.allowed).toBe(false);
      expect(result4.remaining).toBe(0);
    });

    it("should isolate limits per phone number", async () => {
      const result1 = await rateLimiter.checkMessages("5511111111111");
      expect(result1.allowed).toBe(true);

      const result2 = await rateLimiter.checkMessages("5522222222222");
      expect(result2.allowed).toBe(true);
    });
  });

  describe("checkUploads", () => {
    it("should allow uploads within limit", async () => {
      const result1 = await rateLimiter.checkUploads("5511999999999");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = await rateLimiter.checkUploads("5511999999999");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });

    it("should block uploads exceeding limit", async () => {
      await rateLimiter.checkUploads("5511999999999");
      await rateLimiter.checkUploads("5511999999999");

      const result3 = await rateLimiter.checkUploads("5511999999999");
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });
  });

  describe("checkGenerations", () => {
    it("should enforce generation limits (financial protection)", async () => {
      const result1 = await rateLimiter.checkGenerations("5511999999999");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = await rateLimiter.checkGenerations("5511999999999");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);

      const result3 = await rateLimiter.checkGenerations("5511999999999");
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });
  });

  describe("checkOrders", () => {
    it("should enforce order limits", async () => {
      const result1 = await rateLimiter.checkOrders("5511999999999");
      expect(result1.allowed).toBe(true);

      const result2 = await rateLimiter.checkOrders("5511999999999");
      expect(result2.allowed).toBe(true);

      const result3 = await rateLimiter.checkOrders("5511999999999");
      expect(result3.allowed).toBe(false);
    });
  });

  describe("getRemainingTime", () => {
    it("should return TTL for rate limit key", async () => {
      await rateLimiter.checkMessages("5511999999999");

      const ttl = await rateLimiter.getRemainingTime("5511999999999", "messages");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it("should return 0 for expired key", async () => {
      const ttl = await rateLimiter.getRemainingTime("5511999999999", "messages");
      expect(ttl).toBe(0);
    });
  });
});
