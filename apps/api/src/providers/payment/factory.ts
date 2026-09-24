import { hasUsableSecrets } from "../../config/secrets.js";
import type { IPaymentProvider, PaymentProviderMode } from "./payment.provider.interface.js";
import { MockPaymentProvider } from "./mock.provider.js";
import { MercadoPagoProvider } from "./mercadopago.provider.js";

export function createPaymentProvider(
  mode: PaymentProviderMode,
  config?: {
    accessToken?: string;
  },
): IPaymentProvider {
  if (mode === "mock" || !hasUsableSecrets(config?.accessToken)) {
    return new MockPaymentProvider();
  }

  if (!config?.accessToken) {
    return new MockPaymentProvider();
  }

  return new MercadoPagoProvider({
    accessToken: config.accessToken,
  });
}
