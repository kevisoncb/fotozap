import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token")?.value;

    // Se tiver token válido, registra audit log
    if (token) {
      const payload = verifyToken(token);

      if (payload) {
        try {
          await prisma.auditLog.create({
            data: {
              adminId: payload.adminId,
              action: "ADMIN_LOGOUT" as AuditAction,
              ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
              userAgent: request.headers.get("user-agent") || undefined,
            },
          });
        } catch {
          // Não falha o logout se o audit log falhar
        }
      }
    }

    // Remove cookie
    cookieStore.delete("admin-token");

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error logged via NextJS automatic error handling
    // Mesmo com erro, remove o cookie
    const cookieStore = await cookies();
    cookieStore.delete("admin-token");

    return NextResponse.json({ success: true });
  }
}
