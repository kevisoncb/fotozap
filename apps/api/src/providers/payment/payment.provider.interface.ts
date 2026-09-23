export type CreatePixInput = {
  orderId: string;
  amountCents: number;
  currency: string;
  description: string;
  expirationMinutes: number;
};

export type CreatePixResult = {
  externalPaymentId: string;
  pixCode: string;
  pixQrCodeUrl: string;
  expiresAt: Date;
};

export type PixWebhookPayload = {
  id: string;
  type: string;
  data: {
    id: string;
  };
};

export interface IPaymentProvider {
  createPix(input: CreatePixInput): Promise<CreatePixResult>;
  getPaymentStatus(externalPaymentId: string): Promise<"pending" | "approved" | "rejected" | "cancelled">;
  validateWebhookSignature(signature: string, body: string, secret: string): boolean;
}

export type PaymentProviderMode = "mock" | "real";
