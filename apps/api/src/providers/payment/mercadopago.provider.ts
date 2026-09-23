import { createHmac } from "node:crypto";
import type { IPaymentProvider, CreatePixInput, CreatePixResult } from "./payment.provider.interface.js";

export type MercadoPagoConfig = {
  accessToken: string;
};

export class MercadoPagoProvider implements IPaymentProvider {
  private baseUrl = "https://api.mercadopago.com";

  constructor(private config: MercadoPagoConfig) {}

  async createPix(input: CreatePixInput): Promise<CreatePixResult> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + input.expirationMinutes);

    const body = {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      payer: {
        email: "payer@example.com",
      },
      external_reference: input.orderId,
      date_of_expiration: expiresAt.toISOString(),
    };

    const response = await fetch(`${this.baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MERCADOPAGO_CREATE_FAILED: ${error}`);
    }

    const data = (await response.json()) as {
      id: number;
      point_of_interaction: {
        transaction_data: {
          qr_code: string;
          qr_code_base64: string;
          ticket_url: string;
        };
      };
      date_of_expiration: string;
    };

    return {
      externalPaymentId: data.id.toString(),
      pixCode: data.point_of_interaction.transaction_data.qr_code,
      pixQrCodeUrl: data.point_of_interaction.transaction_data.ticket_url,
      expiresAt: new Date(data.date_of_expiration),
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<"pending" | "approved" | "rejected" | "cancelled"> {
    const response = await fetch(`${this.baseUrl}/v1/payments/${externalPaymentId}`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("MERCADOPAGO_GET_PAYMENT_FAILED");
    }

    const data = (await response.json()) as { status: string };

    const statusMap: Record<string, "pending" | "approved" | "rejected" | "cancelled"> = {
      pending: "pending",
      approved: "approved",
      authorized: "approved",
      in_process: "pending",
      in_mediation: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "cancelled",
      charged_back: "cancelled",
    };

    return statusMap[data.status] ?? "pending";
  }

  validateWebhookSignature(signature: string, body: string, secret: string): boolean {
    const hmac = createHmac("sha256", secret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    return signature === expectedSignature;
  }
}
