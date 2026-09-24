import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    // 🧪 MODO DEV: Login fake sem banco de dados
    // DEV MODE: Fake login enabled

    // Gera token fake
    const fakeAdmin = {
      id: "dev-admin-123",
      email: email,
      name: "Admin Development",
      role: "ADMIN" as const,
    };

    const token = signToken({
      adminId: fakeAdmin.id,
      email: fakeAdmin.email,
      role: fakeAdmin.role,
    });

    // Define cookie com JWT token
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      admin: fakeAdmin,
    });
  } catch (error) {
    // Error logged via NextJS automatic error handling
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
