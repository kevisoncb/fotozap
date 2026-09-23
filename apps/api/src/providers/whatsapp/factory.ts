import type { IWhatsAppProvider } from "./whatsapp.provider.interface.js";
import { MockWhatsAppProvider } from "./mock.provider.js";
import { WhatsAppCloudProvider } from "./cloud.provider.js";

export type WhatsAppProviderMode = "mock" | "real";

export function createWhatsAppProvider(
  mode: WhatsAppProviderMode,
  config?: {
    accessToken?: string;
    phoneNumberId?: string;
    verifyToken?: string;
    appSecret?: string;
    apiVersion?: string;
  },
): IWhatsAppProvider {
  if (mode === "mock") {
    return new MockWhatsAppProvider();
  }

  if (!config?.accessToken || !config?.phoneNumberId || !config?.verifyToken || !config?.appSecret) {
    throw new Error(
      "WhatsApp Cloud API requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET",
    );
  }

  return new WhatsAppCloudProvider({
    accessToken: config.accessToken,
    phoneNumberId: config.phoneNumberId,
    verifyToken: config.verifyToken,
    appSecret: config.appSecret,
    apiVersion: config.apiVersion,
  });
}
