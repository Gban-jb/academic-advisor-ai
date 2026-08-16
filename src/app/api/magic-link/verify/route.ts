import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  verifyToken,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=missing", req.url));

  const email = await verifyToken(token, "magic");
  if (!email) return NextResponse.redirect(new URL("/login?error=expired", req.url));

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(SESSION_COOKIE, await signSessionToken(email), sessionCookieOptions);
  return res;
}
