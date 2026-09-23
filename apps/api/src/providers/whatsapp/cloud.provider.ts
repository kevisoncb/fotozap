import { createHmac } from "node:crypto";
import type { IWhatsAppProvider } from "./whatsapp.provider.interface.js";

export type WhatsAppCloudConfig = {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
  apiVersion?: string;
};

export class WhatsAppCloudProvider implements IWhatsAppProvider {
  private baseUrl: string;

  constructor(private config: WhatsAppCloudConfig) {
    const version = config.apiVersion ?? "v21.0";
    this.baseUrl = `https://graph.facebook.com/${version}/${config.phoneNumberId}`;
  }

  async sendText(to: string, body: string): Promise<{ messageId: string }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHATSAPP_SEND_FAILED: ${error}`);
    }

    const data = (await response.json()) as { messages: Array<{ id: string }> };
    return { messageId: data.messages[0]?.id ?? "unknown" };
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: {
          link: imageUrl,
          caption,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHATSAPP_SEND_FAILED: ${error}`);
    }

    const data = (await response.json()) as { messages: Array<{ id: string }> };
    return { messageId: data.messages[0]?.id ?? "unknown" };
  }

  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
  ): Promise<{ messageId: string }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          link: documentUrl,
          filename,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHATSAPP_SEND_FAILED: ${error}`);
    }

    const data = (await response.json()) as { messages: Array<{ id: string }> };
    return { messageId: data.messages[0]?.id ?? "unknown" };
  }

  async downloadMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }> {
    const urlResponse = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      },
    );

    if (!urlResponse.ok) {
      throw new Error("WHATSAPP_MEDIA_DOWNLOAD_FAILED");
    }

    const urlData = (await urlResponse.json()) as { url: string; mime_type: string };

    const fileResponse = await fetch(urlData.url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!fileResponse.ok) {
      throw new Error("WHATSAPP_MEDIA_DOWNLOAD_FAILED");
    }

    const bytes = Buffer.from(await fileResponse.arrayBuffer());
    return { bytes, mimeType: urlData.mime_type };
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === this.config.verifyToken) {
      return challenge;
    }
    return null;
  }

  validateWebhookSignature(signature: string, body: string): boolean {
    const expectedSignature = createHmac("sha256", this.config.appSecret)
      .update(body)
      .digest("hex");

    const receivedSignature = signature.replace("sha256=", "");
    return receivedSignature === expectedSignature;
  }
}
