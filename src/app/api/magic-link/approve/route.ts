import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/auth";
import { db } from "@/lib/db";

const noStore = { "Cache-Control": "no-store" };

async function loadPending(token: string | null) {
  if (!token) return null;
  const result = await verifyMagicToken(token);
  if (!result?.rid) return null;

  const [row] = await db()`
    SELECT code, email FROM login_requests
     WHERE id = ${result.rid} AND consumed = false AND approved = false AND expires_at > now()
  `;
  return row ? { rid: result.rid, code: row.code as string | null, email: row.email as string } : null;
}

/** Details for the confirmation screen — the code the other device is showing. */
export async function GET(req: NextRequest) {
  const pending = await loadPending(req.nextUrl.searchParams.get("token"));
  if (!pending) {
    return NextResponse.json({ status: "unavailable" }, { status: 404, headers: noStore });
  }
  return NextResponse.json(
    { status: "pending", code: pending.code, email: pending.email },
    { headers: noStore }
  );
}

/** The person confirmed the codes match — release the waiting tab. */
export async function POST(req: NextRequest) {
  let token: string | null = null;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }

  const pending = await loadPending(token);
  if (!pending) {
    return NextResponse.json({ status: "unavailable" }, { status: 404, headers: noStore });
  }

  await db()`
    UPDATE login_requests SET approved = true
     WHERE id = ${pending.rid} AND consumed = false AND expires_at > now()
  `;
  return NextResponse.json({ status: "approved" }, { headers: noStore });
}
