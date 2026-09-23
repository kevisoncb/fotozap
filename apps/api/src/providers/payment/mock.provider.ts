import type { IPaymentProvider, CreatePixInput, CreatePixResult } from "./payment.provider.interface.js";

export class MockPaymentProvider implements IPaymentProvider {
  private payments = new Map<string, "pending" | "approved" | "rejected" | "cancelled">();
  private counter = 0;

  async createPix(input: CreatePixInput): Promise<CreatePixResult> {
    this.counter++;
    const externalPaymentId = `mock_payment_${this.counter}`;

    this.payments.set(externalPaymentId, "pending");

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + input.expirationMinutes);

    console.log(`[MockPayment] Created Pix for order ${input.orderId}`, {
      externalPaymentId,
      amountCents: input.amountCents,
    });

    // Auto-approve after 5 seconds for testing
    setTimeout(() => {
      this.payments.set(externalPaymentId, "approved");
      console.log(`[MockPayment] Auto-approved ${externalPaymentId}`);
    }, 5000);

    return {
      externalPaymentId,
      pixCode: `00020126580014br.gov.bcb.pix0136mock-${this.counter}`,
      pixQrCodeUrl: `https://mock-payment.local/qr/${this.counter}`,
      expiresAt,
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<"pending" | "approved" | "rejected" | "cancelled"> {
    return this.payments.get(externalPaymentId) ?? "pending";
  }

  validateWebhookSignature(_signature: string, _body: string, _secret: string): boolean {
    console.log("[MockPayment] validateWebhookSignature (always true)");
    return true;
  }
}
