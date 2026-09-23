export const QUEUE_NAMES = {
  GENERATION: "generation",
  CLEANUP: "cleanup",
  EXPIRATION: "expiration",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
