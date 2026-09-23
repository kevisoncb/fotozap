export type WhatsAppMessage = {
  from: string;
  messageId: string;
  timestamp: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location" | "contacts" | "unknown";
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mimeType: string;
    sha256: string;
    caption?: string;
  };
};

export type WhatsAppWebhookEntry = {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: { name: string };
        wa_id: string;
      }>;
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
};

export type WhatsAppWebhookPayload = {
  object: string;
  entry: WhatsAppWebhookEntry[];
};

export interface IWhatsAppProvider {
  sendText(to: string, body: string): Promise<{ messageId: string }>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
  ): Promise<{ messageId: string }>;
  downloadMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }>;
  verifyWebhook(mode: string, token: string, challenge: string): string | null;
  validateWebhookSignature(signature: string, body: string): boolean;
}
