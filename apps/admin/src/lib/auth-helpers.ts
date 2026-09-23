/**
 * Authentication Helper Functions
 */

import { headers } from "next/headers";
import type { AdminRole } from "../../../../generated/prisma/client";

export interface CurrentAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

/**
 * Obtém o admin atual dos headers (injetados pelo middleware)
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const headersList = await headers();

  const id = headersList.get("x-admin-id");
  const email = headersList.get("x-admin-email");
  const role = headersList.get("x-admin-role");

  if (!id || !email || !role) {
    return null;
  }

  return {
    id,
    email,
    role: role as AdminRole,
  };
}

/**
 * Verifica se o admin atual tem a role especificada
 */
export async function hasRole(requiredRole: AdminRole): Promise<boolean> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return false;
  }

  // ADMIN tem acesso a tudo
  if (admin.role === "ADMIN") {
    return true;
  }

  return admin.role === requiredRole;
}

/**
 * Verifica se o admin atual é ADMIN
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("ADMIN");
}

/**
 * Requer que o admin seja ADMIN (lança erro se não for)
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("Não autenticado");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("Acesso negado: requer permissão de ADMIN");
  }

  return admin;
}
