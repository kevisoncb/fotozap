export const GENERATION_STATUSES = [
  "CREATED",
  "SUBMITTED",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const TERMINAL_GENERATION_STATUSES: readonly GenerationStatus[] = [
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
];

const RANK: Record<GenerationStatus, number> = {
  CREATED: 0,
  SUBMITTED: 1,
  PROCESSING: 2,
  SUCCEEDED: 3,
  FAILED: 3,
  CANCELLED: 3,
};

export function isTerminalGenerationStatus(status: GenerationStatus): boolean {
  return TERMINAL_GENERATION_STATUSES.includes(status);
}

export function canApplyGenerationStatus(
  current: GenerationStatus,
  incoming: GenerationStatus,
): boolean {
  if (current === incoming) {
    return false;
  }
  if (isTerminalGenerationStatus(current)) {
    return false;
  }
  return RANK[incoming] >= RANK[current];
}
