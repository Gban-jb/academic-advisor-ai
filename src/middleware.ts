import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/magic-link"];

/** Every production hostname funnels here, so sessions and sign-in links share one origin. */
const CANONICAL_HOST = "advisingplace.com";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Preview deployments keep their own hostnames — redirecting those would
  // make every preview URL bounce to production.
  if (process.env.VERCEL_ENV === "production") {
    const host = request.headers.get("host");
    if (host && host !== CANONICAL_HOST) {
      const url = new URL(request.url);
      url.protocol = "https:";
      url.host = CANONICAL_HOST;
      return NextResponse.redirect(url, 308);
    }
  }

  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Verify the signature, expiry and domain rule — the cookie merely existing
  // proves nothing, since anyone can set one in their browser.
  const email = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value, "session");

  if (!email) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
