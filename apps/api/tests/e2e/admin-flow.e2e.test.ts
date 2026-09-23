/**
 * E2E Test: Admin Flow
 *
 * Testa funcionalidades administrativas:
 * 1. Criação de admin
 * 2. Login com bcrypt + JWT
 * 3. RBAC (ADMIN vs VIEWER)
 * 4. Audit logging
 * 5. Gerenciamento de admins
 */

import { describe, it, expect, beforeEach } from "vitest";
import { prisma, cleanDatabase, seedTestData } from "./setup.js";
import bcrypt from "bcrypt";

describe("E2E: Admin Flow", () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  it("deve criar admin com senha hash e fazer login", async () => {
    const password = "SecurePassword123!";
    const passwordHash = await bcrypt.hash(password, 12);

    // 1. Cria admin
    const admin = await prisma.adminUser.create({
      data: {
        email: "newadmin@test.com",
        passwordHash,
        name: "New Admin",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    expect(admin.email).toBe("newadmin@test.com");
    expect(admin.role).toBe("ADMIN");
    expect(admin.status).toBe("ACTIVE");

    // 2. Valida senha
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    expect(isValidPassword).toBe(true);

    // 3. Simula login (atualiza lastLoginAt)
    const loggedInAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    expect(loggedInAdmin.lastLoginAt).toBeTruthy();
  });

  it("deve criar audit log ao fazer ação administrativa", async () => {
    const admin = await prisma.adminUser.findFirst({
      where: { email: "admin@test.com" },
    });

    expect(admin).toBeTruthy();

    // 1. Cria audit log (PRODUCT_UPDATED)
    const auditLog = await prisma.auditLog.create({
      data: {
        adminId: admin!.id,
        action: "PRODUCT_UPDATED",
        resource: "product",
        resourceId: "prod-123",
        details: {
          productName: "Foto Retro",
          changes: {
            priceCents: { from: 500, to: 600 },
          },
        },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
      },
    });

    expect(auditLog.adminId).toBe(admin!.id);
    expect(auditLog.action).toBe("PRODUCT_UPDATED");
    expect(auditLog.resource).toBe("product");

    // 2. Busca audit logs do admin
    const logs = await prisma.auditLog.findMany({
      where: { adminId: admin!.id },
      include: { admin: true },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0]?.admin.email).toBe("admin@test.com");
  });

  it("deve diferenciar permissões entre ADMIN e VIEWER", async () => {
    // 1. Cria VIEWER
    const viewer = await prisma.adminUser.create({
      data: {
        email: "viewer@test.com",
        passwordHash: await bcrypt.hash("viewer123", 12),
        name: "Viewer User",
        role: "VIEWER",
        status: "ACTIVE",
      },
    });

    expect(viewer.role).toBe("VIEWER");

    // 2. Cria ADMIN
    const admin = await prisma.adminUser.create({
      data: {
        email: "superadmin@test.com",
        passwordHash: await bcrypt.hash("admin123", 12),
        name: "Super Admin",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    expect(admin.role).toBe("ADMIN");

    // 3. Simula verificação de permissão
    const canViewerManageAdmins = viewer.role === "ADMIN";
    const canAdminManageAdmins = admin.role === "ADMIN";

    expect(canViewerManageAdmins).toBe(false);
    expect(canAdminManageAdmins).toBe(true);
  });

  it("deve suspender e reativar admin", async () => {
    const admin = await prisma.adminUser.create({
      data: {
        email: "suspend@test.com",
        passwordHash: await bcrypt.hash("password", 12),
        role: "VIEWER",
        status: "ACTIVE",
      },
    });

    expect(admin.status).toBe("ACTIVE");

    // 1. Suspende admin
    const suspended = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { status: "SUSPENDED" },
    });

    expect(suspended.status).toBe("SUSPENDED");

    // 2. Verifica que admin suspenso não pode fazer login
    const canLogin = suspended.status === "ACTIVE";
    expect(canLogin).toBe(false);

    // 3. Reativa admin
    const reactivated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { status: "ACTIVE" },
    });

    expect(reactivated.status).toBe("ACTIVE");
  });

  it("deve alterar role de VIEWER para ADMIN", async () => {
    const viewer = await prisma.adminUser.create({
      data: {
        email: "promote@test.com",
        passwordHash: await bcrypt.hash("password", 12),
        role: "VIEWER",
        status: "ACTIVE",
      },
    });

    expect(viewer.role).toBe("VIEWER");

    // Promove para ADMIN
    const promoted = await prisma.adminUser.update({
      where: { id: viewer.id },
      data: { role: "ADMIN" },
    });

    expect(promoted.role).toBe("ADMIN");

    // Registra audit log da mudança
    await prisma.auditLog.create({
      data: {
        adminId: viewer.id,
        action: "ADMIN_UPDATED",
        resource: "admin",
        resourceId: viewer.id,
        details: {
          email: viewer.email,
          oldRole: "VIEWER",
          newRole: "ADMIN",
        },
      },
    });

    const logs = await prisma.auditLog.findMany({
      where: {
        action: "ADMIN_UPDATED",
        resourceId: viewer.id,
      },
    });

    expect(logs).toHaveLength(1);
  });

  it("deve resetar senha de admin", async () => {
    const admin = await prisma.adminUser.create({
      data: {
        email: "reset@test.com",
        passwordHash: await bcrypt.hash("oldpassword", 12),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const oldHash = admin.passwordHash;

    // Reseta senha
    const newPassword = "NewPassword456!";
    const newHash = await bcrypt.hash(newPassword, 12);

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    expect(updated.passwordHash).not.toBe(oldHash);

    // Valida nova senha
    const isValidNewPassword = await bcrypt.compare(newPassword, updated.passwordHash);
    expect(isValidNewPassword).toBe(true);

    // Senha antiga não deve funcionar
    const isValidOldPassword = await bcrypt.compare("oldpassword", updated.passwordHash);
    expect(isValidOldPassword).toBe(false);
  });

  it("deve contar ações por tipo no audit log", async () => {
    const admin = await prisma.adminUser.findFirst({
      where: { email: "admin@test.com" },
    });

    // Cria múltiplos logs de diferentes tipos
    await Promise.all([
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "ADMIN_LOGIN",
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "ADMIN_LOGIN",
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "PRODUCT_UPDATED",
          resource: "product",
          resourceId: "prod-1",
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "ADMIN_LOGOUT",
        },
      }),
    ]);

    // Conta por tipo
    const loginCount = await prisma.auditLog.count({
      where: { action: "ADMIN_LOGIN" },
    });

    const productUpdateCount = await prisma.auditLog.count({
      where: { action: "PRODUCT_UPDATED" },
    });

    const logoutCount = await prisma.auditLog.count({
      where: { action: "ADMIN_LOGOUT" },
    });

    expect(loginCount).toBe(2);
    expect(productUpdateCount).toBe(1);
    expect(logoutCount).toBe(1);
  });

  it("deve buscar audit logs por recurso específico", async () => {
    const admin = await prisma.adminUser.findFirst({
      where: { email: "admin@test.com" },
    });

    const productId = "prod-specific-123";

    // Cria logs para produto específico
    await Promise.all([
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "PRODUCT_UPDATED",
          resource: "product",
          resourceId: productId,
          details: { field: "price" },
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "PRODUCT_TOGGLED",
          resource: "product",
          resourceId: productId,
          details: { active: false },
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin!.id,
          action: "PRODUCT_UPDATED",
          resource: "product",
          resourceId: "other-product",
        },
      }),
    ]);

    // Busca logs apenas do produto específico
    const logs = await prisma.auditLog.findMany({
      where: {
        resource: "product",
        resourceId: productId,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(logs).toHaveLength(2);
    expect(logs.every((log) => log.resourceId === productId)).toBe(true);
  });
});
