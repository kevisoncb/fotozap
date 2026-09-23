import { describe, it, expect, beforeEach, vi } from "vitest";
import { ImageService } from "../../src/modules/images/image.service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStorage = {
  putObject: vi.fn(),
  getObjectUrl: vi.fn(),
  deleteObject: vi.fn(),
  objectExists: vi.fn(),
} as any;

describe("ImageService", () => {
  let service: ImageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageService(mockStorage);
  });

  it("should reject image exceeding max size", () => {
    const bytes = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const result = service.validateImage({
      bytes,
      mimeType: "image/jpeg",
      maxSizeMB: 10,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("IMAGE_TOO_LARGE");
  });

  it("should reject invalid mime type", () => {
    const bytes = Buffer.alloc(1024);

    const result = service.validateImage({
      bytes,
      mimeType: "application/pdf",
      maxSizeMB: 10,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("INVALID_IMAGE_TYPE");
  });

  it("should reject too small image", () => {
    const bytes = Buffer.alloc(50);

    const result = service.validateImage({
      bytes,
      mimeType: "image/jpeg",
      maxSizeMB: 10,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("IMAGE_TOO_SMALL");
  });

  it("should accept valid image", () => {
    const bytes = Buffer.alloc(1024 * 500); // 500KB

    const result = service.validateImage({
      bytes,
      mimeType: "image/jpeg",
      maxSizeMB: 10,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should upload image to storage with correct path", async () => {
    const bytes = Buffer.from("image data");
    mockStorage.putObject.mockResolvedValue(undefined);
    mockStorage.getObjectUrl.mockResolvedValue("https://storage.local/path/file.jpg");

    const result = await service.uploadImage({
      bytes,
      mimeType: "image/png",
      userId: "user123",
      purpose: "input",
    });

    expect(mockStorage.putObject).toHaveBeenCalledWith(
      expect.stringContaining("users/user123/input/"),
      bytes,
      "image/png",
    );
    expect(result.key).toContain("users/user123/input/");
    expect(result.key).toMatch(/\.png$/);
    expect(result.url).toBe("https://storage.local/path/file.jpg");
  });

  it("should use output path for output images", async () => {
    const bytes = Buffer.from("output image");
    mockStorage.putObject.mockResolvedValue(undefined);
    mockStorage.getObjectUrl.mockResolvedValue("https://storage.local/output.jpg");

    const result = await service.uploadImage({
      bytes,
      mimeType: "image/jpeg",
      userId: "user456",
      purpose: "output",
    });

    expect(mockStorage.putObject).toHaveBeenCalledWith(
      expect.stringContaining("users/user456/output/"),
      bytes,
      "image/jpeg",
    );
    expect(result.key).toContain("users/user456/output/");
  });

  it("should delete image", async () => {
    mockStorage.deleteObject.mockResolvedValue(undefined);

    await service.deleteImage("users/user123/input/test.jpg");

    expect(mockStorage.deleteObject).toHaveBeenCalledWith("users/user123/input/test.jpg");
  });
});
