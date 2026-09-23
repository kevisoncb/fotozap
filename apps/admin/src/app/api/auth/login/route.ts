import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AdminAuthService } from "@/lib/admin-auth.service";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "../../../../../../generated/prisma/client.js";

const adminAuthService = new AdminAuthService();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    // Tenta fazer login
    const result = await adminAuthService.login(email, password);

    if (!result.success || !result.token || !result.admin) {
      return NextResponse.json({ error: result.error || "Falha no login" }, { status: 401 });
    }

    // Define cookie com JWT token
    const cookieStore = await cookies();
    cookieStore.set("admin-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Registra audit log
    try {
      await prisma.auditLog.create({
        data: {
          adminId: result.admin.id,
          action: "ADMIN_LOGIN" as AuditAction,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch {
      // Não falha o login se o audit log falhar
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        role: result.admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
