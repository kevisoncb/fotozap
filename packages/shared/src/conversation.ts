export const CONVERSATION_STATES = [
  "IDLE",
  "SELECTING_PRODUCT",
  "WAITING_FOR_IMAGE",
  "IMAGE_RECEIVED",
  "WAITING_FOR_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "COMPLETED",
  "ERROR",
] as const;

export type ConversationState = (typeof CONVERSATION_STATES)[number];

export type ConversationSnapshot = {
  state: ConversationState;
  productId?: string;
  orderDraftId?: string;
  expiresAt?: string;
};

export function conversationKey(phone: string): string {
  return `conversation:${phone}`;
}
