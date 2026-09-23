import { Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { QUEUE_NAMES } from "../queues/queue-names.js";
import type { ExpirationJobData } from "../queues/expiration.queue.js";

export type ExpirationWorkerDeps = {
  redis: Redis;
  prisma: PrismaClient;
};

export function createExpirationWorker(deps: ExpirationWorkerDeps): Worker<ExpirationJobData> {
  const worker = new Worker<ExpirationJobData>(
    QUEUE_NAMES.EXPIRATION,
    async (job: Job<ExpirationJobData>) => {
      job.log("Starting expiration check");

      const now = new Date();

      // Find expired payments that are still pending
      const expiredPayments = await deps.prisma.payment.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
        },
        include: {
          order: true,
        },
      });

      job.log(`Found ${expiredPayments.length} expired payments`);

      let cancelledCount = 0;

      for (const payment of expiredPayments) {
        try {
          // Update payment status
          await deps.prisma.payment.update({
            where: { id: payment.id },
            data: { status: "CANCELLED" },
          });

          // Cancel order if still pending payment
          if (payment.order.status === "PENDING_PAYMENT") {
            await deps.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: "CANCELLED" },
            });
          }

          cancelledCount++;
        } catch (error) {
          job.log(`Failed to cancel payment ${payment.id}: ${error instanceof Error ? error.message : "UNKNOWN"}`);
        }
      }

      job.log(`Expiration check complete. Cancelled: ${cancelledCount}`);

      return {
        expiredPayments: expiredPayments.length,
        cancelledCount,
      };
    },
    {
      connection: deps.redis,
      concurrency: 1,
      autorun: false,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[ExpirationWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ExpirationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
