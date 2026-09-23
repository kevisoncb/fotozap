import { describe, it, expect } from "vitest";
import { MockObjectStorage } from "../../src/providers/storage/mock.provider.js";

describe("MockObjectStorage", () => {
  it("should store and retrieve object", async () => {
    const storage = new MockObjectStorage();
    const buffer = Buffer.from("test data");

    await storage.putObject("test.jpg", buffer, "image/jpeg");

    const exists = await storage.objectExists("test.jpg");
    expect(exists).toBe(true);

    const url = await storage.getObjectUrl("test.jpg");
    expect(url).toContain("test.jpg");
  });

  it("should return false for non-existent object", async () => {
    const storage = new MockObjectStorage();

    const exists = await storage.objectExists("missing.jpg");

    expect(exists).toBe(false);
  });

  it("should delete object", async () => {
    const storage = new MockObjectStorage();
    await storage.putObject("delete-me.jpg", Buffer.from("data"), "image/jpeg");

    await storage.deleteObject("delete-me.jpg");

    const exists = await storage.objectExists("delete-me.jpg");
    expect(exists).toBe(false);
  });

  it("should handle multiple objects", async () => {
    const storage = new MockObjectStorage();

    await storage.putObject("file1.jpg", Buffer.from("1"), "image/jpeg");
    await storage.putObject("file2.png", Buffer.from("2"), "image/png");

    expect(await storage.objectExists("file1.jpg")).toBe(true);
    expect(await storage.objectExists("file2.png")).toBe(true);

    await storage.deleteObject("file1.jpg");

    expect(await storage.objectExists("file1.jpg")).toBe(false);
    expect(await storage.objectExists("file2.png")).toBe(true);
  });
});
