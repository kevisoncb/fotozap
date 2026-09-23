import type { Redis } from "ioredis";
import type { FastifyRequest } from "fastify";

export type RateLimitConfig = {
  maxMessagesPerMinute: number;
  maxUploadsPerHour: number;
  maxGenerationsPerHour: number;
  maxOrdersPerHour: number;
};

export class RateLimiter {
  constructor(
    private redis: Redis,
    private config: RateLimitConfig,
  ) {}

  private key(prefix: string, identifier: string): string {
    return `ratelimit:${prefix}:${identifier}`;
  }

  async checkMessages(phone: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.key("messages", phone);
    const ttl = 60; // 1 minute

    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    const allowed = current <= this.config.maxMessagesPerMinute;
    const remaining = Math.max(0, this.config.maxMessagesPerMinute - current);

    return { allowed, remaining };
  }

  async checkUploads(phone: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.key("uploads", phone);
    const ttl = 3600; // 1 hour

    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    const allowed = current <= this.config.maxUploadsPerHour;
    const remaining = Math.max(0, this.config.maxUploadsPerHour - current);

    return { allowed, remaining };
  }

  async checkGenerations(phone: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.key("generations", phone);
    const ttl = 3600; // 1 hour

    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    const allowed = current <= this.config.maxGenerationsPerHour;
    const remaining = Math.max(0, this.config.maxGenerationsPerHour - current);

    return { allowed, remaining };
  }

  async checkOrders(phone: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.key("orders", phone);
    const ttl = 3600; // 1 hour

    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    const allowed = current <= this.config.maxOrdersPerHour;
    const remaining = Math.max(0, this.config.maxOrdersPerHour - current);

    return { allowed, remaining };
  }

  async getRemainingTime(phone: string, type: "messages" | "uploads" | "generations" | "orders"): Promise<number> {
    const key = this.key(type, phone);
    const ttl = await this.redis.ttl(key);
    return Math.max(0, ttl);
  }
}

export function extractPhoneFromRequest(request: FastifyRequest): string | null {
  // Try to extract from webhook body (WhatsApp)
  const body = request.body as any;
  
  if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from) {
    return body.entry[0].changes[0].value.messages[0].from;
  }

  // Try from headers (custom API calls)
  const phone = request.headers["x-phone-number"] as string | undefined;
  if (phone) {
    return phone;
  }

  // Fallback to IP (not ideal but prevents abuse)
  return request.ip;
}
