import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";
import { wipeUserData } from "@/lib/wipe-user-data";

/**
 * Sign out — clear the session cookie AND wipe the user's persisted planner
 * data. Combined with browser-session cookies and the login-time wipe, this
 * guarantees "close and come back later = fresh start" from every angle.
 */
export async function POST(req: NextRequest) {
  const email = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value, "session");
  if (email) await wipeUserData(email);

  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
