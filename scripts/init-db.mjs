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

// ── plans: one row per student → many named plans per student ───────────────
// Written to be re-runnable: every step is guarded, and existing rows are
// carried over as each student's first plan rather than dropped.
await sql`ALTER TABLE plans ADD COLUMN IF NOT EXISTS id text`;
await sql`ALTER TABLE plans ADD COLUMN IF NOT EXISTS name text`;
await sql`ALTER TABLE plans ADD COLUMN IF NOT EXISTS last_opened_at timestamptz`;

await sql`UPDATE plans SET id = gen_random_uuid()::text WHERE id IS NULL`;
await sql`UPDATE plans SET name = 'My plan' WHERE name IS NULL OR name = ''`;
await sql`UPDATE plans SET last_opened_at = updated_at WHERE last_opened_at IS NULL`;

await sql`ALTER TABLE plans ALTER COLUMN id SET NOT NULL`;
await sql`ALTER TABLE plans ALTER COLUMN name SET NOT NULL`;

// email was the primary key while a student could only have one plan.
const [pk] = await sql`
  SELECT a.attname AS col
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
   WHERE i.indrelid = 'plans'::regclass AND i.indisprimary
`;
if (pk?.col === "email") {
  await sql`ALTER TABLE plans DROP CONSTRAINT plans_pkey`;
  await sql`ALTER TABLE plans ADD PRIMARY KEY (id)`;
  console.log("migrated plans: primary key email → id");
}

await sql`CREATE INDEX IF NOT EXISTS plans_email_idx ON plans (email)`;

// Internship postings mirrored from SimplifyJobs/Summer2027-Internships.
// A listing can advertise several terms, so the key is (id, term).
await sql`
  CREATE TABLE IF NOT EXISTS internships (
    id          text NOT NULL,
    term        text NOT NULL,
    term_start  date NOT NULL,
    company     text NOT NULL,
    title       text NOT NULL,
    category    text NOT NULL,
    url         text NOT NULL,
    company_url text,
    locations   jsonb NOT NULL DEFAULT '[]'::jsonb,
    posted_at   timestamptz,
    synced_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id, term)
  )
`;
// The source carries no deadline, so these are the next best signals: when the
// posting was last touched, who it's open to, and any sponsorship restriction.
await sql`ALTER TABLE internships ADD COLUMN IF NOT EXISTS source_updated_at timestamptz`;
await sql`ALTER TABLE internships ADD COLUMN IF NOT EXISTS degrees jsonb NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE internships ADD COLUMN IF NOT EXISTS sponsorship text`;

await sql`CREATE INDEX IF NOT EXISTS internships_term_idx ON internships (term)`;
await sql`CREATE INDEX IF NOT EXISTS internships_category_idx ON internships (category)`;
await sql`CREATE INDEX IF NOT EXISTS internships_posted_idx ON internships (posted_at DESC)`;

// Saved listings keep their own copy of company/title/url: a posting a student
// bookmarked disappears from `internships` the moment it closes, and losing the
// record of what you saved would be worse than showing it as no longer open.
await sql`
  CREATE TABLE IF NOT EXISTS saved_internships (
    email      text NOT NULL,
    listing_id text NOT NULL,
    term       text NOT NULL,
    company    text NOT NULL,
    title      text NOT NULL,
    url        text NOT NULL,
    category   text,
    saved_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (email, listing_id, term)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS saved_internships_email_idx ON saved_internships (email)`;

// Single-row table used as a lock so concurrent requests don't all pull 10MB.
await sql`
  CREATE TABLE IF NOT EXISTS internship_sync (
    id          integer PRIMARY KEY,
    started_at  timestamptz,
    finished_at timestamptz,
    count       integer
  )
`;
await sql`INSERT INTO internship_sync (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

const cols = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'plans' ORDER BY ordinal_position
`;
console.log("plans table ready:");
for (const c of cols) console.log(`  ${c.column_name.padEnd(12)} ${c.data_type}`);
