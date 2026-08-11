import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Let auth callbacks and login page through
  if (path.startsWith("/api/auth") || path.startsWith("/login")) {
    return NextResponse.next();
  }

  // next-auth v5 stores the session JWT in this cookie
  // (prefixed with __Secure- on HTTPS, plain on HTTP)
  const token =
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
