import type {
  PrismaClient,
  WebhookEvent,
  WebhookEventStatus,
} from "@prisma/client";
import { createHash } from "node:crypto";

export type CreateWebhookEventInput = {
  provider: string;
  externalEventId: string;
  eventType: string;
  payload: unknown;
};

export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  private hashPayload(payload: unknown): string {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  async recordEvent(input: CreateWebhookEventInput): Promise<WebhookEvent | null> {
    const payloadHash = this.hashPayload(input.payload);

    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: input.provider,
          externalEventId: input.externalEventId,
        },
      },
    });

    if (existing) {
      await this.prisma.webhookEvent.update({
        where: { id: existing.id },
        data: { status: "DUPLICATE" },
      });
      return null;
    }

    return this.prisma.webhookEvent.create({
      data: {
        provider: input.provider,
        externalEventId: input.externalEventId,
        eventType: input.eventType,
        payload: input.payload as object,
        payloadHash,
        status: "RECEIVED",
      },
    });
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });
  }

  async markFailed(eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: "FAILED" },
    });
  }

  async markIgnored(eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: "IGNORED" },
    });
  }

  async updateStatus(eventId: string, status: WebhookEventStatus): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status,
        ...(status === "PROCESSED" ? { processedAt: new Date() } : {}),
      },
    });
  }
}
