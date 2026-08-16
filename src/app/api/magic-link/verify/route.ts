import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  verifyMagicToken,
} from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Opening a sign-in link.
 *
 * A cookie can only ever be set on the browser making this request, so when the
 * link is opened on a different device from the one that asked for it, this
 * marks the pending request approved and lets the waiting tab pick it up. If
 * nothing is waiting, it just signs in whoever opened the link.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=missing", req.url));

  const result = await verifyMagicToken(token);
  if (!result) return NextResponse.redirect(new URL("/login?error=expired", req.url));

  if (result.rid) {
    try {
      const rows = await db()`
        SELECT id FROM login_requests
         WHERE id = ${result.rid} AND consumed = false AND expires_at > now()
      `;
      if (rows.length > 0) {
        // Don't release the waiting tab yet — the person has to confirm the two
        // screens show the same code, so a link can't approve a session they
        // never started.
        const url = new URL("/login/confirm", req.url);
        url.searchParams.set("token", token);
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("login_requests lookup failed:", err);
    }
  }

  // Nothing waiting (or the database is unavailable) — sign in this device.
  const res = NextResponse.redirect(new URL(result.next, req.url));
  res.cookies.set(SESSION_COOKIE, await signSessionToken(result.email), sessionCookieOptions);
  return res;
}
