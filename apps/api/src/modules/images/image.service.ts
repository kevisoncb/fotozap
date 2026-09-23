import { randomUUID } from "node:crypto";
import type { IObjectStorage } from "../../providers/storage/storage.provider.interface.js";

export type ValidateImageInput = {
  bytes: Buffer;
  mimeType: string;
  maxSizeMB: number;
};

export type UploadImageInput = {
  bytes: Buffer;
  mimeType: string;
  userId: string;
  purpose: "input" | "output";
};

export class ImageService {
  private allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  constructor(private storage: IObjectStorage) {}

  validateImage(input: ValidateImageInput): { valid: boolean; error?: string } {
    const maxBytes = input.maxSizeMB * 1024 * 1024;

    if (input.bytes.length > maxBytes) {
      return {
        valid: false,
        error: `IMAGE_TOO_LARGE:${input.maxSizeMB}MB`,
      };
    }

    if (!this.allowedMimeTypes.includes(input.mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `INVALID_IMAGE_TYPE:${input.mimeType}`,
      };
    }

    if (input.bytes.length < 100) {
      return {
        valid: false,
        error: "IMAGE_TOO_SMALL",
      };
    }

    return { valid: true };
  }

  async uploadImage(input: UploadImageInput): Promise<{ key: string; url: string }> {
    const extension = this.getExtensionFromMime(input.mimeType);
    const filename = `${randomUUID()}${extension}`;
    const key =
      input.purpose === "input"
        ? `users/${input.userId}/input/${filename}`
        : `users/${input.userId}/output/${filename}`;

    await this.storage.putObject(key, input.bytes, input.mimeType);

    const url = await this.storage.getObjectUrl(key);

    return { key, url };
  }

  async deleteImage(key: string): Promise<void> {
    await this.storage.deleteObject(key);
  }

  async getImageUrl(key: string): Promise<string> {
    return this.storage.getObjectUrl(key);
  }

  private getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    return map[mimeType.toLowerCase()] ?? ".jpg";
  }
}
