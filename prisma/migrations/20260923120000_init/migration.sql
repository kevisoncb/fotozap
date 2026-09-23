-- FotoZap IA initial schema
-- Amounts are integer cents. Timestamps are timestamptz (UTC).

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DELETED', 'BLOCKED');
CREATE TYPE "ContentPolicy" AS ENUM ('ALLOWED', 'BLOCKED', 'REVIEW');
CREATE TYPE "OrderStatus" AS ENUM (
  'CREATED',
  'AWAITING_PAYMENT',
  'PAID',
  'QUEUED',
  'PROCESSING',
  'GENERATION_COMPLETED',
  'DELIVERY_PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);
CREATE TYPE "PaymentStatus" AS ENUM (
  'CREATED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED'
);
CREATE TYPE "GenerationStatus" AS ENUM (
  'CREATED',
  'SUBMITTED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');
CREATE TYPE "WebhookEventStatus" AS ENUM (
  'RECEIVED',
  'PROCESSED',
  'DUPLICATE',
  'IGNORED',
  'FAILED'
);
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "JobPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "whatsappPhone" TEXT NOT NULL,
  "name" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "lastInteractionAt" TIMESTAMPTZ,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_whatsappPhone_key" ON "User"("whatsappPhone");

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "prompt" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "contentPolicy" "ContentPolicy" NOT NULL DEFAULT 'ALLOWED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_active_sortOrder_idx" ON "Product"("active", "sortOrder");
CREATE INDEX "Product_provider_idx" ON "Product"("provider");

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "inputImageKey" TEXT,
  "outputImageKey" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "paidAt" TIMESTAMPTZ,
  "processingStartedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "failedAt" TIMESTAMPTZ,
  "cancelledAt" TIMESTAMPTZ,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalPaymentId" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "rawStatus" TEXT,
  "pixCopyPaste" TEXT,
  "pixQrCodeBase64" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "paidAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_provider_externalPaymentId_key" ON "Payment"("provider", "externalPaymentId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE TABLE "Generation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "externalId" TEXT,
  "status" "GenerationStatus" NOT NULL DEFAULT 'CREATED',
  "prompt" TEXT NOT NULL,
  "inputUrl" TEXT,
  "outputUrl" TEXT,
  "estimatedCost" DECIMAL(12, 6),
  "durationMs" INTEGER,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Generation_provider_externalId_key" ON "Generation"("provider", "externalId");
CREATE INDEX "Generation_orderId_idx" ON "Generation"("orderId");
CREATE INDEX "Generation_status_idx" ON "Generation"("status");

CREATE TABLE "Delivery" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'whatsapp',
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "externalMessageId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Delivery_orderId_status_idx" ON "Delivery"("orderId", "status");

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMPTZ,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookEvent_provider_externalEventId_key" ON "WebhookEvent"("provider", "externalEventId");
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "WebhookEvent"("provider", "eventType");
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "externalMessageId" TEXT,
  "direction" "MessageDirection" NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT,
  "mediaId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Message_externalMessageId_key" ON "Message"("externalMessageId");
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

CREATE TABLE "ConversationAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConversationAudit_userId_createdAt_idx" ON "ConversationAudit"("userId", "createdAt");

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
