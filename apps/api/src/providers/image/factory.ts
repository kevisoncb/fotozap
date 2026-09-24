import { hasUsableSecrets } from "../../config/secrets.js";
import type { IImageProvider, ImageProviderMode } from "./image.provider.interface.js";
import { MockImageProvider } from "./mock.provider.js";
import { OpenAIImageProvider } from "./openai.provider.js";

export function createImageProvider(
  mode: ImageProviderMode,
  config?: {
    apiKey?: string;
    model?: string;
    size?: "1024x1024" | "1792x1024" | "1024x1792";
    quality?: "standard" | "hd";
  },
): IImageProvider {
  if (mode === "mock" || !hasUsableSecrets(config?.apiKey)) {
    return new MockImageProvider();
  }

  if (!config?.apiKey) {
    return new MockImageProvider();
  }

  return new OpenAIImageProvider({
    apiKey: config.apiKey,
    model: config.model,
    size: config.size,
    quality: config.quality,
  });
}
