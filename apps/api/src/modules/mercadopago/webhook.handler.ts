import type { FastifyRequest, FastifyReply } from "fastify";
import type { IPaymentProvider } from "../../providers/payment/payment.provider.interface.js";
import type { PaymentFlowService } from "../payment/payment-flow.service.js";
import type { WebhookService } from "../webhooks/webhook.service.js";

export class MercadoPagoWebhookHandler {
  constructor(
    private paymentProvider: IPaymentProvider,
    private paymentFlowService: PaymentFlowService,
    private webhookService: WebhookService,
    private webhookSecret: string,
  ) {}

  async handleWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const signature = request.headers["x-signature"] as string | undefined;
    const body = JSON.stringify(request.body);

    if (!signature) {
      reply.code(400).send({ error: "Missing signature" });
      return;
    }

    if (!this.paymentProvider.validateWebhookSignature(signature, body, this.webhookSecret)) {
      reply.code(403).send({ error: "Invalid signature" });
      return;
    }

    reply.code(200).send({ success: true });

    setImmediate(async () => {
      try {
        await this.processWebhook(request.body as MercadoPagoWebhookPayload);
      } catch (error) {
        request.log.error({ error }, "Failed to process MercadoPago webhook");
      }
    });
  }

  private async processWebhook(payload: MercadoPagoWebhookPayload): Promise<void> {
    const eventId = payload.id?.toString() ?? `mp_${Date.now()}`;

    const duplicate = await this.webhookService.recordEvent({
      source: "mercadopago",
      eventId,
      eventType: payload.type ?? "unknown",
      payload,
    });

    if (duplicate) {
      return;
    }

    if (payload.type !== "payment") {
      await this.webhookService.markProcessed(eventId, "SKIPPED");
      return;
    }

    try {
      const externalPaymentId = payload.data?.id?.toString();

      if (!externalPaymentId) {
        throw new Error("MISSING_PAYMENT_ID");
      }

      const status = await this.paymentProvider.getPaymentStatus(externalPaymentId);

      if (status === "approved") {
        await this.paymentFlowService.handlePaymentApproved(externalPaymentId);
      }

      await this.webhookService.markProcessed(eventId, "SUCCESS");
    } catch (error) {
      await this.webhookService.markProcessed(
        eventId,
        "ERROR",
        error instanceof Error ? error.message : "UNKNOWN_ERROR",
      );
      throw error;
    }
  }
}

type MercadoPagoWebhookPayload = {
  id?: number;
  type?: string;
  data?: {
    id?: number;
  };
};
