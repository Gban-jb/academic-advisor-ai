import { neon } from "@neondatabase/serverless";

/**
 * Neon's HTTP driver, not a TCP pool — each query is a stateless request, which
 * is what serverless functions want. Resolved per call so a missing
 * DATABASE_URL fails at request time rather than at module load.
 */
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}
