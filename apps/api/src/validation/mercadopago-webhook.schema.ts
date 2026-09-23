import { z } from "zod";

export const MercadoPagoWebhookPayloadSchema = z.object({
  id: z.number().or(z.string()).optional(),
  type: z.string().optional(),
  data: z
    .object({
      id: z.number().or(z.string()).optional(),
    })
    .optional(),
});

export type MercadoPagoWebhookPayloadValidated = z.infer<typeof MercadoPagoWebhookPayloadSchema>;

export function validateMercadoPagoWebhook(data: unknown): MercadoPagoWebhookPayloadValidated {
  return MercadoPagoWebhookPayloadSchema.parse(data);
}
