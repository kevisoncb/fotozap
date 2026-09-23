import type { PrismaClient, Message } from "../../../../../generated/prisma/client.js";

export type CreateMessageInput = {
  userId: string;
  externalMessageId?: string;
  direction: "INBOUND" | "OUTBOUND";
  type: string;
  content?: string;
  mediaId?: string;
};

export class MessageService {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateMessageInput): Promise<Message> {
    if (input.externalMessageId) {
      const existing = await this.prisma.message.findUnique({
        where: { externalMessageId: input.externalMessageId },
      });
      if (existing) {
        return existing;
      }
    }

    return this.prisma.message.create({
      data: {
        userId: input.userId,
        externalMessageId: input.externalMessageId,
        direction: input.direction,
        type: input.type,
        content: input.content,
        mediaId: input.mediaId,
      },
    });
  }

  async findRecentByUser(userId: string, limit = 10): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
