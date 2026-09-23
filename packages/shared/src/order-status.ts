export const ORDER_STATUSES = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAID",
  "QUEUED",
  "PROCESSING",
  "GENERATION_COMPLETED",
  "DELIVERY_PENDING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREATED: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["QUEUED", "FAILED"],
  QUEUED: ["PROCESSING", "FAILED"],
  PROCESSING: ["GENERATION_COMPLETED", "FAILED"],
  GENERATION_COMPLETED: ["DELIVERY_PENDING", "COMPLETED", "FAILED"],
  DELIVERY_PENDING: ["COMPLETED", "DELIVERY_PENDING", "FAILED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionOrder(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`INVALID_ORDER_TRANSITION:${from}->${to}`);
  }
  return to;
}
