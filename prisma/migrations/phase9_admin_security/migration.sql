-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ADMIN_LOGIN', 'ADMIN_LOGOUT', 'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_SUSPENDED', 'PRODUCT_UPDATED', 'PRODUCT_TOGGLED', 'ORDER_VIEWED', 'GENERATION_VIEWED');

-- AlterTable AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "name" TEXT,
                         ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'VIEWER',
                         ADD COLUMN "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
                         ADD COLUMN "lastLoginAt" TIMESTAMP(3),
                         ADD COLUMN "createdBy" TEXT;

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_status_idx" ON "AdminUser"("status");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
