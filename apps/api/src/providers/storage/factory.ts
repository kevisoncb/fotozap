import { hasUsableSecrets } from "../../config/secrets.js";
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
  const canUseR2 = hasUsableSecrets(
    config?.accountId,
    config?.accessKeyId,
    config?.secretAccessKey,
    config?.bucket,
    config?.publicUrl,
  );

  if (mode === "mock" || !canUseR2) {
    return new MockObjectStorage();
  }

  if (
    !config?.accountId ||
    !config?.accessKeyId ||
    !config?.secretAccessKey ||
    !config?.bucket ||
    !config?.publicUrl
  ) {
    return new MockObjectStorage();
  }

  return new R2ObjectStorage({
    accountId: config.accountId,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    publicUrl: config.publicUrl,
  });
}
