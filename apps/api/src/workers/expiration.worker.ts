import { Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import type { PrismaClient } from "@prisma/client";
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

          // Cancel order if still awaiting payment
          if (payment.order.status === "AWAITING_PAYMENT") {
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
    job.log(`Expiration worker job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    job?.log(`Expiration worker failed: ${err instanceof Error ? err.message : String(err)}`);
  });

  return worker;
}
