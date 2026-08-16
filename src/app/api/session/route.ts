import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/api-auth";

/** Public endpoint so the header can show "Sign in" or "Sign out" correctly. */
export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  return NextResponse.json(
    { authenticated: Boolean(email), email },
    { headers: { "Cache-Control": "no-store" } }
  );
}
