import { Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import type { PrismaClient } from "@prisma/client";
import type { IImageProvider } from "../providers/image/image.provider.interface.js";
import type { IObjectStorage } from "../providers/storage/storage.provider.interface.js";
import type { IWhatsAppProvider } from "../providers/whatsapp/whatsapp.provider.interface.js";
import type { GenerationService } from "../modules/generations/generation.service.js";
import type { OrderService } from "../modules/orders/order.service.js";
import { QUEUE_NAMES } from "../queues/queue-names.js";
import type { GenerationJobData } from "../queues/generation.queue.js";

export type GenerationWorkerDeps = {
  redis: Redis;
  prisma: PrismaClient;
  imageProvider: IImageProvider;
  storage: IObjectStorage;
  whatsapp: IWhatsAppProvider;
  generationService: GenerationService;
  orderService: OrderService;
  concurrency: number;
};

export function createGenerationWorker(deps: GenerationWorkerDeps): Worker<GenerationJobData> {
  const worker = new Worker<GenerationJobData>(
    QUEUE_NAMES.GENERATION,
    async (job: Job<GenerationJobData>) => {
      const { orderId, userId } = job.data;

      job.log(`Starting generation for order ${orderId}`);

      // 1. Get order and product
      const order = await deps.orderService.findById(orderId);
      if (!order) {
        throw new Error(`ORDER_NOT_FOUND:${orderId}`);
      }

      const product = await deps.prisma.product.findUnique({
        where: { id: order.productId },
      });

      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND:${order.productId}`);
      }

      // 2. Get user for phone
      const user = await deps.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.whatsappPhone) {
        throw new Error(`USER_NOT_FOUND_OR_NO_PHONE:${userId}`);
      }

      // 3. Create Generation record
      const generation = await deps.generationService.create({
        orderId,
        prompt: product.prompt || "Transform this image",
        provider: "openai",
        model: "dall-e-3",
      });

      job.log(`Generation record created: ${generation.id}`);

      try {
        // 4. Update status to PROCESSING
        await deps.generationService.updateStatus({
          generationId: generation.id,
          status: "PROCESSING",
        });
        await deps.orderService.transitionStatus({ orderId, newStatus: "PROCESSING" });

        await deps.whatsapp.sendText(
          user.whatsappPhone,
          "🎨 Gerando sua imagem... Isso pode levar alguns minutos.",
        );

        // 5. Get input image URL from storage
        let inputImageUrl: string | undefined;
        if (order.inputImageKey) {
          inputImageUrl = await deps.storageProvider.getPublicUrl(order.inputImageKey);
        }
        if (!inputImageUrl) {
          throw new Error(`NO_INPUT_IMAGE:${orderId}`);
        }

        // 6. Call AI provider
        job.log("Calling AI provider...");
        const result = await deps.imageProvider.generateImage({
          prompt: product.prompt || "Transform this image",
          referenceImageUrl: inputImageUrl,
        });

        job.log(`AI generation complete: ${result.imageUrl}`);

        // 7. Download generated image
        const response = await fetch(result.imageUrl);
        if (!response.ok) {
          throw new Error(`DOWNLOAD_FAILED:${response.status}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // 8. Upload to storage
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        const extension = mimeType.includes("png") ? ".png" : ".jpg";
        const outputKey = `users/${userId}/output/${generation.id}${extension}`;

        await deps.storage.putObject(outputKey, imageBuffer, mimeType);

        job.log(`Uploaded to storage: ${outputKey}`);

        // 9. Update generation
        const generatedImageUrl = await deps.storage.getObjectUrl(outputKey);
        await deps.generationService.updateStatus({
          generationId: generation.id,
          status: "SUCCEEDED",
          outputUrl: generatedImageUrl,
        });

        // 10. Update order
        await deps.orderService.transitionStatus({ orderId, newStatus: "GENERATION_COMPLETED" });
        await deps.orderService.transitionStatus({ orderId, newStatus: "DELIVERY_PENDING" });

        // 11. Send to WhatsApp
        await deps.whatsapp.sendImage(
          user.whatsappPhone,
          generatedImageUrl,
          "✅ Sua imagem está pronta! 🎉",
        );

        await deps.orderService.transitionStatus({ orderId, newStatus: "COMPLETED" });

        job.log("Generation complete and delivered");

        return {
          success: true,
          generationId: generation.id,
          outputKey,
        };
      } catch (error) {
        job.log(`Error: ${error instanceof Error ? error.message : "UNKNOWN"}`);

        await deps.generationService.updateStatus({
          generationId: generation.id,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        });

        await deps.orderService.transitionStatus({ orderId, newStatus: "FAILED" });

        if (user.whatsappPhone) {
          await deps.whatsapp.sendText(
            user.whatsappPhone,
            "❌ Erro ao processar sua imagem. Entre em contato com o suporte.",
          );
        }

        throw error;
      }
    },
    {
      connection: deps.redis,
      concurrency: deps.concurrency,
      autorun: false,
    },
  );

  worker.on("completed", (job) => {
    job.log(`Generation worker job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    job?.log(`Generation worker failed: ${err instanceof Error ? err.message : String(err)}`);
  });

  return worker;
}
