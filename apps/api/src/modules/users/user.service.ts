import type { PrismaClient, User } from "../../../../../generated/prisma/client.js";

export type CreateUserInput = {
  whatsappPhone: string;
  name?: string;
};

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { whatsappPhone: phone },
    });
  }

  async findOrCreate(input: CreateUserInput): Promise<User> {
    const existing = await this.findByPhone(input.whatsappPhone);
    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { lastInteractionAt: new Date() },
      });
      return existing;
    }

    return this.prisma.user.create({
      data: {
        whatsappPhone: input.whatsappPhone,
        name: input.name,
        lastInteractionAt: new Date(),
      },
    });
  }

  async markDeleted(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        name: null,
      },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
