import type { Redis } from "ioredis";
import type { ConversationSnapshot } from "@fotozap/shared";
import { conversationKey } from "@fotozap/shared";

export class ConversationService {
  constructor(
    private redis: Redis,
    private ttlSeconds: number,
  ) {}

  async get(phone: string): Promise<ConversationSnapshot | null> {
    const key = conversationKey(phone);
    const data = await this.redis.get(key);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as ConversationSnapshot;
    } catch {
      return null;
    }
  }

  async set(phone: string, snapshot: ConversationSnapshot): Promise<void> {
    const key = conversationKey(phone);
    await this.redis.setex(key, this.ttlSeconds, JSON.stringify(snapshot));
  }

  async delete(phone: string): Promise<void> {
    const key = conversationKey(phone);
    await this.redis.del(key);
  }

  async extend(phone: string): Promise<void> {
    const key = conversationKey(phone);
    await this.redis.expire(key, this.ttlSeconds);
  }

  async getOrDefault(phone: string): Promise<ConversationSnapshot> {
    const existing = await this.get(phone);
    if (existing) {
      return existing;
    }

    const defaultSnapshot: ConversationSnapshot = {
      state: "IDLE",
    };

    await this.set(phone, defaultSnapshot);
    return defaultSnapshot;
  }

  async setState(
    phone: string,
    state: ConversationSnapshot["state"],
    data?: Partial<Omit<ConversationSnapshot, "state">>,
  ): Promise<void> {
    const snapshot: ConversationSnapshot = {
      state,
      ...data,
    };
    await this.set(phone, snapshot);
  }
}
