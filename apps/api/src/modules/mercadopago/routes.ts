import type { FastifyInstance } from "fastify";
import type { MercadoPagoWebhookHandler } from "./webhook.handler.js";

export function registerMercadoPagoRoutes(
  app: FastifyInstance,
  handler: MercadoPagoWebhookHandler,
): void {
  app.post("/webhooks/mercadopago", async (request, reply) => {
    await handler.handleWebhook(request, reply);
  });
}
