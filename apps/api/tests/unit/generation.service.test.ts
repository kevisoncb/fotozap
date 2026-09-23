import { describe, it, expect, beforeEach, vi } from "vitest";
import { GenerationService } from "../../src/modules/generations/generation.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = {
  generation: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe("GenerationService", () => {
  let service: GenerationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GenerationService(mockPrisma);
  });

  it("should create generation when none exists for order", async () => {
    mockPrisma.generation.findFirst.mockResolvedValue(null);
    mockPrisma.generation.create.mockResolvedValue({
      id: "gen1",
      orderId: "order1",
      status: "CREATED",
    });

    const gen = await service.create({
      orderId: "order1",
      provider: "openai",
      model: "dall-e-3",
      prompt: "test",
    });

    expect(gen.id).toBe("gen1");
  });

  it("should reject duplicate active generation for same order", async () => {
    mockPrisma.generation.findFirst.mockResolvedValue({
      id: "gen1",
      orderId: "order1",
      status: "PROCESSING",
    });

    await expect(
      service.create({
        orderId: "order1",
        provider: "openai",
        model: "dall-e-3",
        prompt: "test",
      }),
    ).rejects.toThrow("DUPLICATE_GENERATION");
  });

  it("should ignore out-of-order status updates from webhook", async () => {
    mockPrisma.generation.findUnique.mockResolvedValue({
      id: "gen1",
      status: "SUCCEEDED",
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const result = await service.updateStatus({
      generationId: "gen1",
      status: "PROCESSING",
    });

    expect(mockPrisma.generation.update).not.toHaveBeenCalled();
    expect(result.status).toBe("SUCCEEDED");
  });

  it("should allow progression from processing to succeeded", async () => {
    const startedAt = new Date(Date.now() - 5000);
    mockPrisma.generation.findUnique.mockResolvedValue({
      id: "gen1",
      status: "PROCESSING",
      startedAt,
    });
    mockPrisma.generation.update.mockResolvedValue({
      id: "gen1",
      status: "SUCCEEDED",
      startedAt,
      completedAt: new Date(),
      durationMs: 5000,
    });

    const result = await service.updateStatus({
      generationId: "gen1",
      status: "SUCCEEDED",
      outputUrl: "https://example.com/output.jpg",
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(mockPrisma.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCEEDED",
          outputUrl: "https://example.com/output.jpg",
          completedAt: expect.any(Date),
        }),
      }),
    );
  });
});
