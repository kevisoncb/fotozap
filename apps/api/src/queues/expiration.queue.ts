import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { QUEUE_NAMES } from "./queue-names.js";

export type ExpirationJobData = {
  reason: "scheduled" | "manual";
};

export function createExpirationQueue(redis: Redis): Queue<ExpirationJobData> {
  return new Queue<ExpirationJobData>(QUEUE_NAMES.EXPIRATION, {
    connection: redis,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 30000, // 30 seconds
      },
      removeOnComplete: true,
      removeOnFail: {
        count: 50,
      },
    },
  });
}
