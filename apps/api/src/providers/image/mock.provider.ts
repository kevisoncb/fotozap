import type { IImageProvider, ImageGenerationInput, ImageGenerationResult } from "./image.provider.interface.js";

export class MockImageProvider implements IImageProvider {
  private counter = 0;

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    this.counter++;
    
    console.log(`[MockImageProvider] Generate #${this.counter}`, {
      prompt: input.prompt.substring(0, 50),
      style: input.style,
      hasReference: !!input.referenceImageUrl,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      imageUrl: `https://mock-ai.local/generated/${this.counter}.jpg`,
      revisedPrompt: input.prompt,
      metadata: {
        mockId: this.counter,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
