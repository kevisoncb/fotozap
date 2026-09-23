/**
 * JWT Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { signToken, verifyToken } from "../../src/lib/jwt.js";
import type { JwtPayload } from "../../src/lib/jwt.js";

describe("JWT Utilities", () => {
  const mockPayload: JwtPayload = {
    adminId: "admin-123",
    email: "admin@example.com",
    role: "ADMIN",
  };

  beforeEach(() => {
    // Reset env
    vi.unstubAllEnvs();
  });

  it("should sign a JWT token", () => {
    const token = signToken(mockPayload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  it("should verify a valid token", () => {
    const token = signToken(mockPayload);
    const decoded = verifyToken(token);

    expect(decoded).toBeDefined();
    expect(decoded?.adminId).toBe(mockPayload.adminId);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });

  it("should reject an invalid token", () => {
    const invalidToken = "invalid.token.here";
    const decoded = verifyToken(invalidToken);

    expect(decoded).toBeNull();
  });

  it("should reject a tampered token", () => {
    const token = signToken(mockPayload);
    const tamperedToken = token.slice(0, -10) + "xxxxxxxxxx";

    const decoded = verifyToken(tamperedToken);

    expect(decoded).toBeNull();
  });

  it("should include expiration in token", () => {
    const token = signToken(mockPayload);

    // Decode without verification to check structure
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    expect(payload.exp).toBeDefined();
    expect(payload.iat).toBeDefined();
  });
});
