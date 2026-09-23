import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { QUEUE_NAMES } from "./queue-names.js";

export type CleanupJobData = {
  reason: "scheduled" | "manual";
  dryRun?: boolean;
};

export function createCleanupQueue(redis: Redis): Queue<CleanupJobData> {
  return new Queue<CleanupJobData>(QUEUE_NAMES.CLEANUP, {
    connection: redis,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 60000, // 1 minute
      },
      removeOnComplete: true,
      removeOnFail: {
        count: 50,
      },
    },
  });
}
