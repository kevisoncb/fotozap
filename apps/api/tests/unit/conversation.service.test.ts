import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConversationService } from "../../src/modules/conversations/conversation.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
} as any;

describe("ConversationService", () => {
  let service: ConversationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ConversationService(mockRedis, 3600);
  });

  it("should return null for non-existent conversation", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await service.get("+5511999999999");

    expect(result).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith("conversation:+5511999999999");
  });

  it("should parse and return existing conversation", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ state: "WAITING_FOR_IMAGE", productId: "prod1" }));

    const result = await service.get("+5511999999999");

    expect(result).toEqual({ state: "WAITING_FOR_IMAGE", productId: "prod1" });
  });

  it("should set conversation with TTL", async () => {
    mockRedis.setex.mockResolvedValue("OK");

    await service.set("+5511999999999", { state: "SELECTING_PRODUCT" });

    expect(mockRedis.setex).toHaveBeenCalledWith(
      "conversation:+5511999999999",
      3600,
      JSON.stringify({ state: "SELECTING_PRODUCT" }),
    );
  });

  it("should return default IDLE state when no conversation exists", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");

    const result = await service.getOrDefault("+5511999999999");

    expect(result.state).toBe("IDLE");
    expect(mockRedis.setex).toHaveBeenCalled();
  });

  it("should delete conversation", async () => {
    mockRedis.del.mockResolvedValue(1);

    await service.delete("+5511999999999");

    expect(mockRedis.del).toHaveBeenCalledWith("conversation:+5511999999999");
  });

  it("should extend conversation TTL", async () => {
    mockRedis.expire.mockResolvedValue(1);

    await service.extend("+5511999999999");

    expect(mockRedis.expire).toHaveBeenCalledWith("conversation:+5511999999999", 3600);
  });
});
