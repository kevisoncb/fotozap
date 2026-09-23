import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/jwt.js";

export function middleware(request: NextRequest) {
  // Allow login page and auth API routes
  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check JWT token
  const token = request.cookies.get("admin-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token
  const payload = verifyToken(token);

  if (!payload) {
    // Token inválido ou expirado
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("admin-token");
    return response;
  }

  // Adiciona payload ao request headers para uso nas páginas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-id", payload.adminId);
  requestHeaders.set("x-admin-email", payload.email);
  requestHeaders.set("x-admin-role", payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
