import type { Queue } from "bullmq";
import type { CleanupJobData } from "../queues/cleanup.queue.js";

export function scheduleCleanupJobs(queue: Queue<CleanupJobData>, intervalHours: number): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Run immediately on startup
  queue.add(
    "cleanup-startup",
    { reason: "scheduled" },
    {
      jobId: `cleanup-${Date.now()}`,
    },
  ).catch((error) => {
    console.error("[CleanupScheduler] Failed to add startup job:", error);
  });

  // Then run periodically
  const timer = setInterval(async () => {
    try {
      await queue.add(
        "cleanup-periodic",
        { reason: "scheduled" },
        {
          jobId: `cleanup-${Date.now()}`,
        },
      );
      console.log("[CleanupScheduler] Added periodic cleanup job");
    } catch (error) {
      console.error("[CleanupScheduler] Failed to add periodic job:", error);
    }
  }, intervalMs);

  console.log(`[CleanupScheduler] Scheduled every ${intervalHours}h`);

  return timer;
}
