import type { IObjectStorage } from "./storage.provider.interface.js";

export class MockObjectStorage implements IObjectStorage {
  private storage = new Map<string, { body: Buffer; contentType: string }>();

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    this.storage.set(key, { body, contentType });
    console.log(`[MockStorage] PUT ${key} (${body.length} bytes, ${contentType})`);
  }

  async getObjectUrl(key: string): Promise<string> {
    const exists = this.storage.has(key);
    const url = `https://mock-storage.local/${key}`;
    console.log(`[MockStorage] GET URL ${key} → ${url} (exists: ${exists})`);
    return url;
  }

  async deleteObject(key: string): Promise<void> {
    const deleted = this.storage.delete(key);
    console.log(`[MockStorage] DELETE ${key} (existed: ${deleted})`);
  }

  async objectExists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
}
