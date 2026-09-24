"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth-helpers";
import { AdminAuthService } from "@/lib/admin-auth.service";
import type { AdminRole, AdminStatus, AuditAction } from "@prisma/client";

const adminAuthService = new AdminAuthService();

export async function createAdmin(data: {
  email: string;
  password: string;
  name?: string;
  role: AdminRole;
}) {
  // Requer permissão de ADMIN
  const currentAdmin = await requireAdmin();

  // Cria admin
  const newAdmin = await adminAuthService.createAdmin({
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    createdBy: currentAdmin.id,
  });

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "ADMIN_CREATED" as AuditAction,
        resource: "admin",
        resourceId: newAdmin.id,
        details: {
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/admins");

  return newAdmin;
}

export async function updateAdminStatus(adminId: string, status: AdminStatus) {
  // Requer permissão de ADMIN
  const currentAdmin = await requireAdmin();

  // Não pode suspender a si mesmo
  if (currentAdmin.id === adminId && status === "SUSPENDED") {
    throw new Error("Você não pode suspender sua própria conta");
  }

  const targetAdmin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, status: true },
  });

  if (!targetAdmin) {
    throw new Error("Admin não encontrado");
  }

  await adminAuthService.updateStatus(adminId, status);

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "ADMIN_SUSPENDED" as AuditAction,
        resource: "admin",
        resourceId: adminId,
        details: {
          email: targetAdmin.email,
          oldStatus: targetAdmin.status,
          newStatus: status,
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/admins");
}

export async function updateAdminRole(adminId: string, role: AdminRole) {
  // Requer permissão de ADMIN
  const currentAdmin = await requireAdmin();

  // Não pode alterar sua própria role
  if (currentAdmin.id === adminId) {
    throw new Error("Você não pode alterar sua própria permissão");
  }

  const targetAdmin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, role: true },
  });

  if (!targetAdmin) {
    throw new Error("Admin não encontrado");
  }

  await adminAuthService.updateRole(adminId, role);

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "ADMIN_UPDATED" as AuditAction,
        resource: "admin",
        resourceId: adminId,
        details: {
          email: targetAdmin.email,
          oldRole: targetAdmin.role,
          newRole: role,
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/admins");
}

export async function resetAdminPassword(adminId: string, newPassword: string) {
  // Requer permissão de ADMIN
  const currentAdmin = await requireAdmin();

  if (newPassword.length < 8) {
    throw new Error("Senha deve ter no mínimo 8 caracteres");
  }

  const targetAdmin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true },
  });

  if (!targetAdmin) {
    throw new Error("Admin não encontrado");
  }

  await adminAuthService.resetPassword(adminId, newPassword);

  // Registra audit log
  try {
    await prisma.auditLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "ADMIN_UPDATED" as AuditAction,
        resource: "admin",
        resourceId: adminId,
        details: {
          email: targetAdmin.email,
          action: "password_reset",
        },
      },
    });
  } catch {
    // Não falha a operação se o audit log falhar
  }

  revalidatePath("/admins");
}
