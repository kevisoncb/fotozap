/**
 * Audit Log Service Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogService } from "../../src/services/audit-log.service.js";
import type { PrismaClient } from "@prisma/client";

describe("AuditLogService", () => {
  let service: AuditLogService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: async (args: unknown) => ({
          id: "log-123",
          ...((args as { data: unknown }).data as object),
          createdAt: new Date(),
          admin: {
            id: "admin-123",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        }),
        findMany: async () => [
          {
            id: "log-1",
            adminId: "admin-123",
            action: "PRODUCT_UPDATED",
            resource: "product",
            resourceId: "prod-1",
            details: { name: "Test Product" },
            ipAddress: "127.0.0.1",
            userAgent: "Test Agent",
            createdAt: new Date(),
            admin: {
              id: "admin-123",
              email: "admin@example.com",
              name: "Admin User",
              role: "ADMIN",
            },
          },
        ],
        groupBy: async () => [
          {
            action: "PRODUCT_UPDATED",
            _count: { id: 5 },
          },
          {
            action: "ADMIN_LOGIN",
            _count: { id: 10 },
          },
        ],
      },
    };

    service = new AuditLogService(mockPrisma as PrismaClient);
  });

  it("should create an audit log", async () => {
    const log = await service.create({
      adminId: "admin-123",
      action: "PRODUCT_UPDATED",
      resource: "product",
      resourceId: "prod-1",
      details: { name: "Test Product" },
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
    });

    expect(log.id).toBe("log-123");
    expect(log.adminId).toBe("admin-123");
    expect(log.action).toBe("PRODUCT_UPDATED");
    expect(log.resource).toBe("product");
    expect(log.resourceId).toBe("prod-1");
  });

  it("should list audit logs", async () => {
    const logs = await service.list();

    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("PRODUCT_UPDATED");
    expect(logs[0]?.admin.email).toBe("admin@example.com");
  });

  it("should find logs by resource", async () => {
    const logs = await service.findByResource("product", "prod-1");

    expect(logs).toHaveLength(1);
    expect(logs[0]?.resource).toBe("product");
    expect(logs[0]?.resourceId).toBe("prod-1");
  });

  it("should count logs by action", async () => {
    const counts = await service.countByAction();

    expect(counts).toHaveLength(2);
    expect(counts[0]?.action).toBe("PRODUCT_UPDATED");
    expect(counts[0]?.count).toBe(5);
    expect(counts[1]?.action).toBe("ADMIN_LOGIN");
    expect(counts[1]?.count).toBe(10);
  });

  it("should handle optional fields", async () => {
    const log = await service.create({
      adminId: "admin-123",
      action: "ADMIN_LOGIN",
    });

    expect(log.id).toBe("log-123");
    expect(log.adminId).toBe("admin-123");
    expect(log.action).toBe("ADMIN_LOGIN");
  });
});
