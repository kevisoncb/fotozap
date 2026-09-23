import type { IWhatsAppProvider } from "./whatsapp.provider.interface.js";

export class MockWhatsAppProvider implements IWhatsAppProvider {
  private messageCounter = 0;

  async sendText(to: string, body: string): Promise<{ messageId: string }> {
    const messageId = `mock_msg_${++this.messageCounter}`;
    console.log(`[MockWhatsApp] sendText to=${to} body=${body.substring(0, 50)}`);
    return { messageId };
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }> {
    const messageId = `mock_msg_${++this.messageCounter}`;
    console.log(
      `[MockWhatsApp] sendImage to=${to} url=${imageUrl} caption=${caption?.substring(0, 30)}`,
    );
    return { messageId };
  }

  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
  ): Promise<{ messageId: string }> {
    const messageId = `mock_msg_${++this.messageCounter}`;
    console.log(`[MockWhatsApp] sendDocument to=${to} filename=${filename} url=${documentUrl}`);
    return { messageId };
  }

  async downloadMedia(_mediaId: string): Promise<{ bytes: Buffer; mimeType: string }> {
    console.log(`[MockWhatsApp] downloadMedia id=${_mediaId}`);
    return {
      bytes: Buffer.from("mock image data"),
      mimeType: "image/jpeg",
    };
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    console.log(`[MockWhatsApp] verifyWebhook mode=${mode} token=${token}`);
    if (mode === "subscribe" && token === "mock_verify_token") {
      return challenge;
    }
    return null;
  }

  validateWebhookSignature(_signature: string, _body: string): boolean {
    console.log(`[MockWhatsApp] validateWebhookSignature (always true for mock)`);
    return true;
  }
}
