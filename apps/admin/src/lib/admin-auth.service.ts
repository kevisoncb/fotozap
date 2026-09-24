/**
 * Admin Authentication Service
 */

import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { signToken } from "./jwt";
import type { AdminRole, AdminStatus } from "@prisma/client";

export interface LoginResult {
  success: boolean;
  token?: string;
  admin?: {
    id: string;
    email: string;
    name: string | null;
    role: AdminRole;
  };
  error?: string;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  name?: string;
  role: AdminRole;
  createdBy?: string;
}

export class AdminAuthService {
  /**
   * Autentica um admin por email e senha
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Busca admin por email
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!admin) {
      return { success: false, error: "Email ou senha incorretos" };
    }

    // Verifica se admin está ativo
    if (admin.status !== "ACTIVE") {
      return { success: false, error: "Conta suspensa" };
    }

    // Verifica senha
    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      return { success: false, error: "Email ou senha incorretos" };
    }

    // Atualiza lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Gera JWT token
    const token = signToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  /**
   * Cria um novo admin
   */
  async createAdmin(input: CreateAdminInput) {
    // Verifica se email já existe
    const existing = await prisma.adminUser.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new Error("Email já cadastrado");
    }

    // Hash da senha
    const passwordHash = await hashPassword(input.password);

    // Cria admin
    const admin = await prisma.adminUser.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name || null,
        role: input.role,
        status: "ACTIVE",
        createdBy: input.createdBy || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return admin;
  }

  /**
   * Lista todos os admins
   */
  async listAdmins() {
    return prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Atualiza status de um admin
   */
  async updateStatus(adminId: string, status: AdminStatus) {
    return prisma.adminUser.update({
      where: { id: adminId },
      data: { status },
    });
  }

  /**
   * Atualiza role de um admin
   */
  async updateRole(adminId: string, role: AdminRole) {
    return prisma.adminUser.update({
      where: { id: adminId },
      data: { role },
    });
  }

  /**
   * Reseta senha de um admin
   */
  async resetPassword(adminId: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);

    return prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash },
    });
  }
}
