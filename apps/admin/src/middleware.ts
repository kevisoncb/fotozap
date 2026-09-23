import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow login page
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Check authentication cookie
  const authCookie = request.cookies.get("admin-auth");

  if (!authCookie || authCookie.value !== "authenticated") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
