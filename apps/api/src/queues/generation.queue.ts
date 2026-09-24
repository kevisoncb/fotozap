import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { QUEUE_NAMES } from "./queue-names.js";

export type GenerationJobData = {
  orderId: string;
  userId: string;
  productId: string;
};

export function createGenerationQueue(redis: Redis): Queue<GenerationJobData> {
  return new Queue<GenerationJobData>(QUEUE_NAMES.GENERATION, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
        age: 86400, // 24 hours
      },
      removeOnFail: {
        count: 500,
        age: 259200, // 3 days
      },
    },
  });
}
