import OpenAI from "openai";
import type { IImageProvider, ImageGenerationInput, ImageGenerationResult } from "./image.provider.interface.js";

export type OpenAIImageConfig = {
  apiKey: string;
  model?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
};

export class OpenAIImageProvider implements IImageProvider {
  private client: OpenAI;
  private model: string;
  private size: "1024x1024" | "1792x1024" | "1024x1792";
  private quality: "standard" | "hd";

  constructor(config: OpenAIImageConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? "dall-e-3";
    this.size = config.size ?? "1024x1024";
    this.quality = config.quality ?? "standard";
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const finalPrompt = this.buildPrompt(input);

    const response = await this.client.images.generate({
      model: this.model,
      prompt: finalPrompt,
      n: 1,
      size: this.size,
      quality: this.quality,
      response_format: "url",
    });

    const image = response.data?.[0];

    if (!image?.url) {
      throw new Error("OPENAI_NO_IMAGE_URL");
    }

    return {
      imageUrl: image.url,
      revisedPrompt: image.revised_prompt,
      metadata: {
        model: this.model,
        size: this.size,
        quality: this.quality,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.retrieve(this.model);
      return true;
    } catch {
      return false;
    }
  }

  private buildPrompt(input: ImageGenerationInput): string {
    const parts: string[] = [input.prompt];

    if (input.style) {
      parts.push(`Style: ${input.style}`);
    }

    if (input.negativePrompt) {
      parts.push(`Avoid: ${input.negativePrompt}`);
    }

    return parts.join(". ");
  }
}
