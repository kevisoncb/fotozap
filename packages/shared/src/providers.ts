export type ImageGenerationInput = {
  prompt: string;
  inputImageUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
};

export type ImageEditInput = ImageGenerationInput;

export type ImageGenerationResult = {
  externalId: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  outputUrls?: string[];
  metadata?: Record<string, unknown>;
};

export interface ImageProvider {
  generate(input: ImageGenerationInput): Promise<ImageGenerationResult>;
  edit(input: ImageEditInput): Promise<ImageGenerationResult>;
}

export type PixCharge = {
  externalPaymentId: string;
  copyPaste: string;
  qrCodeBase64?: string;
  expiresAt: Date;
};

export interface PaymentProvider {
  createPixCharge(input: {
    orderId: string;
    amountCents: number;
    description: string;
  }): Promise<PixCharge>;
  getPaymentStatus(externalPaymentId: string): Promise<string>;
}

export interface WhatsAppProvider {
  sendText(to: string, body: string): Promise<{ messageId: string }>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendDocument(to: string, documentUrl: string, filename: string): Promise<{ messageId: string }>;
  downloadMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }>;
}

export interface ObjectStorage {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getObjectUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
