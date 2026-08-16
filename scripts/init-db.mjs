/**
 * Creates the tables the app needs. Safe to re-run.
 *
 *   node --env-file=.env.local scripts/init-db.mjs
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS plans (
    email      text PRIMARY KEY,
    data       jsonb NOT NULL,
    step       integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS rate_limits (
    key          text NOT NULL,
    window_start timestamptz NOT NULL,
    count        integer NOT NULL DEFAULT 0,
    PRIMARY KEY (key, window_start)
  )
`;

// Lets a sign-in started on one device be completed by a link clicked on another.
await sql`
  CREATE TABLE IF NOT EXISTS login_requests (
    id         text PRIMARY KEY,
    email      text NOT NULL,
    next_path  text NOT NULL DEFAULT '/',
    approved   boolean NOT NULL DEFAULT false,
    consumed   boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
  )
`;

// Shown on both screens so the person confirming can tell they're approving
// their own sign-in and not somebody else's waiting session.
await sql`ALTER TABLE login_requests ADD COLUMN IF NOT EXISTS code text`;

const cols = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'plans' ORDER BY ordinal_position
`;
console.log("plans table ready:");
for (const c of cols) console.log(`  ${c.column_name.padEnd(12)} ${c.data_type}`);
