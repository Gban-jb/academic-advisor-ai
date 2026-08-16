import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "./auth";

/**
 * Session check for route handlers.
 *
 * The middleware already blocks unauthenticated requests to protected paths,
 * but these routes spend money (OpenAI, Gemini, Pinecone) and reach personal
 * data, so they verify for themselves rather than trusting the layer above.
 */
export function getSessionEmail(req: NextRequest): Promise<string | null> {
  return verifyToken(req.cookies.get(SESSION_COOKIE)?.value, "session");
}

/** Returns null when authorised, or the 401 response to return as-is. */
export async function requireSession(req: NextRequest): Promise<NextResponse | null> {
  const email = await getSessionEmail(req);
  if (email) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
