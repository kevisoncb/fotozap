import type { FastifyInstance } from "fastify";
import type { WhatsAppWebhookHandler } from "./webhook.handler.js";

export function registerWhatsAppRoutes(
  app: FastifyInstance,
  handler: WhatsAppWebhookHandler,
): void {
  app.get(
    "/webhooks/whatsapp",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["hub.mode", "hub.challenge", "hub.verify_token"],
          properties: {
            "hub.mode": { type: "string" },
            "hub.challenge": { type: "string" },
            "hub.verify_token": { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      await handler.handleVerification(request, reply);
    },
  );

  app.post("/webhooks/whatsapp", async (request, reply) => {
    await handler.handleWebhook(request, reply);
  });
}
