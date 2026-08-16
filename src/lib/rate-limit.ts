import type { NextRequest } from "next/server";
import { db } from "./db";

/**
 * Fixed-window rate limiting, backed by Postgres.
 *
 * Serverless functions don't share memory, so an in-process counter would reset
 * every cold start and count separately per instance. The database is the one
 * place every invocation already agrees on.
 */

/** Cloudflare sits in front of us, so its header is the trustworthy one. */
export function clientIp(req: NextRequest): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  resetAt: Date;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const resetAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  const rows = await db()`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (key, window_start) DO UPDATE
      SET count = rate_limits.count + 1
    RETURNING count
  `;

  const count = Number(rows[0]?.count ?? 1);

  // Cheap opportunistic cleanup — no cron needed, and it costs one delete
  // roughly every hundred requests rather than one per request.
  if (Math.random() < 0.01) {
    const cutoff = new Date(now - windowSeconds * 1000 * 4).toISOString();
    await db()`DELETE FROM rate_limits WHERE window_start < ${cutoff}`.catch(() => {});
  }

  return { allowed: count <= limit, count, limit, resetAt };
}
