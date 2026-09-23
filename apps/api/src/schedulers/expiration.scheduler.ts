import type { Queue } from "bullmq";
import type { ExpirationJobData } from "../queues/expiration.queue.js";

export function scheduleExpirationJobs(queue: Queue<ExpirationJobData>, intervalMinutes: number): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000;

  // Run immediately on startup
  queue.add(
    "expiration-startup",
    { reason: "scheduled" },
    {
      jobId: `expiration-${Date.now()}`,
    },
  ).catch((error) => {
    console.error("[ExpirationScheduler] Failed to add startup job:", error);
  });

  // Then run periodically
  const timer = setInterval(async () => {
    try {
      await queue.add(
        "expiration-periodic",
        { reason: "scheduled" },
        {
          jobId: `expiration-${Date.now()}`,
        },
      );
      console.log("[ExpirationScheduler] Added periodic expiration job");
    } catch (error) {
      console.error("[ExpirationScheduler] Failed to add periodic job:", error);
    }
  }, intervalMs);

  console.log(`[ExpirationScheduler] Scheduled every ${intervalMinutes}min`);

  return timer;
}
