import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { wipeUserData } from "@/lib/wipe-user-data";

const noStore = { "Cache-Control": "no-store" };

/**
 * Polled by the tab that requested a sign-in link.
 *
 * Once the link has been opened anywhere, this is what actually hands the
 * session to the waiting browser. The row is marked consumed in the same
 * statement that claims it, so a given approval can only ever mint one session.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ status: "invalid" }, { status: 400, headers: noStore });

  let rows;
  try {
    rows = await db()`
      UPDATE login_requests
         SET consumed = true
       WHERE id = ${id}
         AND approved = true
         AND consumed = false
         AND expires_at > now()
      RETURNING email, next_path
    `;
  } catch (err) {
    console.error("login_requests poll failed:", err);
    return NextResponse.json({ status: "pending" }, { headers: noStore });
  }

  const claimed = rows[0];
  if (!claimed) {
    // Either still waiting, already used, or expired — all the same to the tab.
    const [existing] = await db()`
      SELECT expires_at > now() AS alive FROM login_requests WHERE id = ${id}
    `;
    if (!existing || !existing.alive) {
      return NextResponse.json({ status: "expired" }, { headers: noStore });
    }
    return NextResponse.json({ status: "pending" }, { headers: noStore });
  }

  // Cross-device login: same fresh-slate policy as the direct login path.
  await wipeUserData(claimed.email as string);

  const res = NextResponse.json(
    { status: "approved", next: claimed.next_path ?? "/" },
    { headers: noStore }
  );
  res.cookies.set(
    SESSION_COOKIE,
    await signSessionToken(claimed.email as string),
    sessionCookieOptions
  );
  return res;
}
