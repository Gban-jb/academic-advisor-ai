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

const cols = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'plans' ORDER BY ordinal_position
`;
console.log("plans table ready:");
for (const c of cols) console.log(`  ${c.column_name.padEnd(12)} ${c.data_type}`);
