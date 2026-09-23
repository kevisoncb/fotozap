export type ImageGenerationInput = {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  referenceImageUrl?: string;
};

export type ImageGenerationResult = {
  imageUrl: string;
  revisedPrompt?: string;
  metadata?: Record<string, unknown>;
};

export interface IImageProvider {
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
  healthCheck(): Promise<boolean>;
}

export type ImageProviderMode = "mock" | "openai";
