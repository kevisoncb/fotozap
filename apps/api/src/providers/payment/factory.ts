import type { IPaymentProvider, PaymentProviderMode } from "./payment.provider.interface.js";
import { MockPaymentProvider } from "./mock.provider.js";
import { MercadoPagoProvider } from "./mercadopago.provider.js";

export function createPaymentProvider(
  mode: PaymentProviderMode,
  config?: {
    accessToken?: string;
  },
): IPaymentProvider {
  if (mode === "mock") {
    return new MockPaymentProvider();
  }

  if (!config?.accessToken) {
    throw new Error("Mercado Pago provider requires MERCADOPAGO_ACCESS_TOKEN");
  }

  return new MercadoPagoProvider({
    accessToken: config.accessToken,
  });
}
