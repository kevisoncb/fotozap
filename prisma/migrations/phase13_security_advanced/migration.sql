-- Phase 13: Security Advanced
-- Two-Factor Authentication, Refresh Tokens, Session Management

-- AdminSession table for refresh token management
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- Admin2FA table for TOTP secrets
CREATE TABLE "Admin2FA" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabledAt" TIMESTAMP(3),

    CONSTRAINT "Admin2FA_pkey" PRIMARY KEY ("id")
);

-- LoginAttempt table for rate limiting and auditing
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "AdminSession_refreshToken_key" ON "AdminSession"("refreshToken");
CREATE UNIQUE INDEX "Admin2FA_adminId_key" ON "Admin2FA"("adminId");

-- Indexes for performance
CREATE INDEX "AdminSession_adminId_isRevoked_idx" ON "AdminSession"("adminId", "isRevoked");
CREATE INDEX "AdminSession_refreshToken_idx" ON "AdminSession"("refreshToken");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- Foreign keys
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Admin2FA" ADD CONSTRAINT "Admin2FA_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "AdminSession" IS 'Stores refresh tokens and device information for session management';
COMMENT ON TABLE "Admin2FA" IS 'Stores TOTP secrets and backup codes for two-factor authentication';
COMMENT ON TABLE "LoginAttempt" IS 'Logs all login attempts for rate limiting and security auditing';
