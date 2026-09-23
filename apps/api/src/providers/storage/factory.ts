import type { IObjectStorage, StorageProviderMode } from "./storage.provider.interface.js";
import { MockObjectStorage } from "./mock.provider.js";
import { R2ObjectStorage } from "./r2.provider.js";

export function createStorageProvider(
  mode: StorageProviderMode,
  config?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    publicUrl?: string;
  },
): IObjectStorage {
  if (mode === "mock") {
    return new MockObjectStorage();
  }

  if (
    !config?.accountId ||
    !config?.accessKeyId ||
    !config?.secretAccessKey ||
    !config?.bucket ||
    !config?.publicUrl
  ) {
    throw new Error(
      "R2 storage requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL",
    );
  }

  return new R2ObjectStorage({
    accountId: config.accountId,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    publicUrl: config.publicUrl,
  });
}
