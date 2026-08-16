import { SignJWT, jwtVerify } from "jose";

/**
 * Auth helpers for the magic-link login.
 *
 * Edge-safe on purpose — `jose` is the only import, so `middleware.ts` can use
 * this exact same code to verify sessions without pulling in Node-only APIs.
 */

/** The only domains allowed to sign in. */
export const ALLOWED_DOMAINS = ["gmail.com", "bulldogs.aamu.edu"] as const;

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
 * Sign-in is limited to @gmail.com and @bulldogs.aamu.edu — nothing else.
 * Expects an already-normalised (trimmed, lower-cased) address.
 */
export function isAllowedEmail(email: string): boolean {
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(email);
  if (!match) return false;
  return (ALLOWED_DOMAINS as readonly string[]).includes(match[1]);
}

export function signMagicToken(email: string): Promise<string> {
  return new SignJWT({ email, typ: "magic" satisfies TokenType })
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

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
} as const;
