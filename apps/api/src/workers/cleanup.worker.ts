import { Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { IObjectStorage } from "../providers/storage/storage.provider.interface.js";
import { QUEUE_NAMES } from "../queues/queue-names.js";
import type { CleanupJobData } from "../queues/cleanup.queue.js";

export type CleanupWorkerDeps = {
  redis: Redis;
  prisma: PrismaClient;
  storage: IObjectStorage;
  inputRetentionHours: number;
  outputRetentionDays: number;
};

export function createCleanupWorker(deps: CleanupWorkerDeps): Worker<CleanupJobData> {
  const worker = new Worker<CleanupJobData>(
    QUEUE_NAMES.CLEANUP,
    async (job: Job<CleanupJobData>) => {
      const { dryRun = false } = job.data;

      job.log(`Starting cleanup (dryRun: ${dryRun})`);

      const now = new Date();
      const inputCutoff = new Date(now.getTime() - deps.inputRetentionHours * 60 * 60 * 1000);
      const outputCutoff = new Date(now.getTime() - deps.outputRetentionDays * 24 * 60 * 60 * 1000);

      // Find expired input images (Orders with old input images)
      const expiredInputOrders = await deps.prisma.order.findMany({
        where: {
          inputImageKey: { not: null },
          createdAt: { lt: inputCutoff },
        },
        select: {
          id: true,
          inputImageKey: true,
        },
      });

      job.log(`Found ${expiredInputOrders.length} expired input images`);

      let deletedInputCount = 0;

      for (const order of expiredInputOrders) {
        if (!order.inputImageKey) continue;

        if (!dryRun) {
          try {
            await deps.storage.deleteObject(order.inputImageKey);
            await deps.prisma.order.update({
              where: { id: order.id },
              data: { inputImageKey: null },
            });
            deletedInputCount++;
          } catch (error) {
            job.log(`Failed to delete input image: ${order.inputImageKey}`);
          }
        }
      }

      // Find expired output images (Orders with output images)
      const expiredOutputOrders = await deps.prisma.order.findMany({
        where: {
          outputImageKey: { not: null },
          completedAt: { lt: outputCutoff },
        },
        select: {
          id: true,
          outputImageKey: true,
        },
      });

      job.log(`Found ${expiredOutputOrders.length} expired output images`);

      let deletedOutputCount = 0;

      for (const order of expiredOutputOrders) {
        if (!order.outputImageKey) continue;

        if (!dryRun) {
          try {
            await deps.storage.deleteObject(order.outputImageKey);
            await deps.prisma.order.update({
              where: { id: order.id },
              data: { outputImageKey: null },
            });
            deletedOutputCount++;
          } catch (error) {
            job.log(`Failed to delete output image: ${order.outputImageKey}`);
          }
        }
      }

      job.log(`Cleanup complete. Input: ${deletedInputCount}, Output: ${deletedOutputCount}`);

      return {
        inputImagesDeleted: deletedInputCount,
        outputImagesDeleted: deletedOutputCount,
        dryRun,
      };
    },
    {
      connection: deps.redis,
      concurrency: 1,
      autorun: false,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[CleanupWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[CleanupWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
