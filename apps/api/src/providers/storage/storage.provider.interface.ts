export interface IObjectStorage {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getObjectUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
}

export type StorageProviderMode = "mock" | "r2";
