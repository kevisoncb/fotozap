import type {
  PrismaClient,
  Generation,
  GenerationStatus,
} from "@prisma/client";
import { canApplyGenerationStatus, isTerminalGenerationStatus } from "@fotozap/shared";
import type { Decimal } from "@prisma/client/runtime/library";

export type CreateGenerationInput = {
  orderId: string;
  provider: string;
  model: string;
  prompt: string;
  inputUrl?: string;
};

export type UpdateGenerationStatusInput = {
  generationId: string;
  status: GenerationStatus;
  externalId?: string;
  outputUrl?: string;
  estimatedCost?: Decimal;
  errorCode?: string;
  errorMessage?: string;
};

export class GenerationService {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateGenerationInput): Promise<Generation> {
    const existing = await this.prisma.generation.findFirst({
      where: {
        orderId: input.orderId,
        status: { in: ["CREATED", "SUBMITTED", "PROCESSING"] },
      },
    });

    if (existing) {
      throw new Error("DUPLICATE_GENERATION");
    }

    return this.prisma.generation.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        model: input.model,
        prompt: input.prompt,
        inputUrl: input.inputUrl,
        status: "CREATED",
      },
    });
  }

  async findById(generationId: string): Promise<Generation | null> {
    return this.prisma.generation.findUnique({
      where: { id: generationId },
    });
  }

  async findByExternalId(provider: string, externalId: string): Promise<Generation | null> {
    return this.prisma.generation.findUnique({
      where: {
        provider_externalId: {
          provider,
          externalId,
        },
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Generation | null> {
    return this.prisma.generation.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(input: UpdateGenerationStatusInput): Promise<Generation> {
    const generation = await this.findById(input.generationId);
    if (!generation) {
      throw new Error("GENERATION_NOT_FOUND");
    }

    if (!canApplyGenerationStatus(generation.status, input.status)) {
      return generation;
    }

    const now = new Date();
    const data: {
      status: GenerationStatus;
      externalId?: string;
      outputUrl?: string;
      estimatedCost?: Decimal;
      errorCode?: string;
      errorMessage?: string;
      startedAt?: Date;
      completedAt?: Date;
      durationMs?: number;
      updatedAt: Date;
    } = {
      status: input.status,
      updatedAt: now,
    };

    if (input.externalId) {
      data.externalId = input.externalId;
    }

    if (input.outputUrl) {
      data.outputUrl = input.outputUrl;
    }

    if (input.estimatedCost) {
      data.estimatedCost = input.estimatedCost;
    }

    if (input.errorCode) {
      data.errorCode = input.errorCode;
    }

    if (input.errorMessage) {
      data.errorMessage = input.errorMessage;
    }

    if (input.status === "SUBMITTED" && !generation.startedAt) {
      data.startedAt = now;
    }

    if (isTerminalGenerationStatus(input.status) && !generation.completedAt) {
      data.completedAt = now;
      if (generation.startedAt) {
        data.durationMs = now.getTime() - generation.startedAt.getTime();
      }
    }

    return this.prisma.generation.update({
      where: { id: input.generationId },
      data,
    });
  }

  async setExternalId(generationId: string, externalId: string): Promise<Generation> {
    return this.prisma.generation.update({
      where: { id: generationId },
      data: { externalId },
    });
  }
}
