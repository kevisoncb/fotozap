import { describe, it, expect } from "vitest";
import { MockImageProvider } from "../../src/providers/image/mock.provider.js";

describe("MockImageProvider", () => {
  it("should generate image with mock URL", async () => {
    const provider = new MockImageProvider();

    const result = await provider.generateImage({
      prompt: "A beautiful sunset",
      style: "photorealistic",
    });

    expect(result.imageUrl).toContain("https://mock-ai.local/generated/");
    expect(result.revisedPrompt).toBe("A beautiful sunset");
    expect(result.metadata).toHaveProperty("mockId");
  });

  it("should increment counter for each generation", async () => {
    const provider = new MockImageProvider();

    const result1 = await provider.generateImage({ prompt: "Test 1" });
    const result2 = await provider.generateImage({ prompt: "Test 2" });

    expect(result1.imageUrl).not.toBe(result2.imageUrl);
    expect(result1.metadata?.mockId).toBe(1);
    expect(result2.metadata?.mockId).toBe(2);
  });

  it("should return healthy status", async () => {
    const provider = new MockImageProvider();

    const healthy = await provider.healthCheck();

    expect(healthy).toBe(true);
  });

  it("should handle negative prompt", async () => {
    const provider = new MockImageProvider();

    const result = await provider.generateImage({
      prompt: "A cat",
      negativePrompt: "dog",
    });

    expect(result.imageUrl).toBeDefined();
  });
});
