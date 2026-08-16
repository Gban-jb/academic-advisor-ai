import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

/** Every production hostname funnels here, so sessions and sign-in links share one origin. */
const CANONICAL_HOST = "advisingplace.com";

/**
 * The site is public by default; only these need a session. Anything that
 * spends API credits or touches a student's own data belongs on this list.
 */
const PROTECTED_PREFIXES = [
  "/planner",
  "/banner",
  "/report-print",
  "/api/chat",
  "/api/advise",
  "/api/extract-transcript",
  "/api/banner",
  "/api/plans",
];

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

  if (!PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Verify the signature, expiry and domain rule — the cookie merely existing
  // proves nothing, since anyone can set one in their browser.
  const email = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value, "session");
  if (email) return NextResponse.next();

  // API callers get a status they can act on; people get sent to sign in and
  // returned to the page they were reaching for.
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", path + request.nextUrl.search);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
