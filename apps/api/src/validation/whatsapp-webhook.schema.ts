import { z } from "zod";

const WhatsAppMessageSchema = z.object({
  from: z.string().min(1),
  messageId: z.string().min(1),
  timestamp: z.string(),
  type: z.enum([
    "text",
    "image",
    "document",
    "audio",
    "video",
    "location",
    "contacts",
    "unknown",
  ]),
  text: z
    .object({
      body: z.string(),
    })
    .optional(),
  image: z
    .object({
      id: z.string(),
      mimeType: z.string(),
      sha256: z.string(),
      caption: z.string().optional(),
    })
    .optional(),
});

const WhatsAppChangeSchema = z.object({
  value: z.object({
    messaging_product: z.string(),
    metadata: z.object({
      display_phone_number: z.string(),
      phone_number_id: z.string(),
    }),
    contacts: z
      .array(
        z.object({
          profile: z.object({
            name: z.string(),
          }),
          wa_id: z.string(),
        }),
      )
      .optional(),
    messages: z.array(WhatsAppMessageSchema).optional(),
    statuses: z
      .array(
        z.object({
          id: z.string(),
          status: z.string(),
          timestamp: z.string(),
          recipient_id: z.string(),
        }),
      )
      .optional(),
  }),
  field: z.string(),
});

const WhatsAppEntrySchema = z.object({
  id: z.string(),
  changes: z.array(WhatsAppChangeSchema),
});

export const WhatsAppWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(WhatsAppEntrySchema),
});

export type WhatsAppWebhookPayloadValidated = z.infer<typeof WhatsAppWebhookPayloadSchema>;

export function validateWhatsAppWebhook(data: unknown): WhatsAppWebhookPayloadValidated {
  return WhatsAppWebhookPayloadSchema.parse(data);
}
