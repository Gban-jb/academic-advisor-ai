import { SignJWT, jwtVerify } from "jose";

/**
 * Auth helpers for the magic-link login.
 *
 * Edge-safe on purpose — `jose` is the only import, so `middleware.ts` can use
 * this exact same code to verify sessions without pulling in Node-only APIs.
 */

export const SESSION_COOKIE = "aamu.session";

const MAGIC_LINK_TTL = "15m";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** `magic` tokens are emailed out; `session` tokens live in the cookie. */
type TokenType = "magic" | "session";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export function normaliseEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/**
 * Any @gmail.com address, any .edu address, or any address in the
 * ALLOWED_EMAILS env var may sign in. Expects a normalised email.
 */
export function isAllowedEmail(email: string): boolean {
  const match = /^[^\s@]+@([^\s@.]+\.[^\s@]+)$/.exec(email);
  if (!match) return false;
  const domain = match[1];
  if (domain === "gmail.com") return true;
  if (domain.endsWith(".edu")) return true;
  const extra = (process.env.ALLOWED_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return extra.includes(email);
}

/**
 * Only same-site absolute paths survive. A protocol-relative value like
 * `//evil.com` is a valid URL to the browser, so rejecting it here is what
 * stops the sign-in link being turned into an open redirect.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function signMagicToken(email: string, next = "/", rid?: string): Promise<string> {
  return new SignJWT({ email, typ: "magic" satisfies TokenType, next: safeNextPath(next), rid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(MAGIC_LINK_TTL)
    .sign(secret());
}

export function signSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, typ: "session" satisfies TokenType })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

/**
 * Verifies signature, expiry, token type *and* the domain rule, and returns the
 * email — or null if anything is off. Re-checking the domain here means a link
 * issued before the rules tightened can't be redeemed afterwards.
 */
export async function verifyToken(
  token: string | undefined,
  expected: TokenType
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.typ !== expected) return null;
    const email = normaliseEmail(payload.email);
    return isAllowedEmail(email) ? email : null;
  } catch {
    return null;
  }
}

/**
 * Like verifyToken, but also returns where the link should land and which
 * pending sign-in request (if any) this link was issued for.
 */
export async function verifyMagicToken(
  token: string | undefined
): Promise<{ email: string; next: string; rid: string | null } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.typ !== "magic") return null;
    const email = normaliseEmail(payload.email);
    if (!isAllowedEmail(email)) return null;
    return {
      email,
      next: safeNextPath(payload.next),
      rid: typeof payload.rid === "string" ? payload.rid : null,
    };
  } catch {
    return null;
  }
}

/**
 * Session cookie options.
 *
 * Deliberately a browser-session cookie (no `maxAge`, no `expires`): the browser
 * discards it as soon as the browser is closed. Combined with the wipe-on-login
 * flow that clears saved plans, this makes the app effectively ephemeral —
 * closing the browser and coming back requires signing in again and starts
 * with a fresh, empty planner. The JWT still carries a 7-day expiry as a
 * server-side backstop in case a browser hangs onto the cookie unexpectedly.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
