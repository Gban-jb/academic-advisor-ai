import { db } from "./db";

/**
 * Mirrors internship postings from the community-maintained
 * SimplifyJobs/Summer2027-Internships list into our own database.
 *
 * The source file is ~10MB and updated daily, so it's pulled on a schedule
 * rather than per request, trimmed to the fields we show, and filtered to terms
 * that haven't started yet — a student browsing in August 2026 shouldn't be
 * reading Summer 2026 postings.
 */

export const SOURCE_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json";
export const SOURCE_REPO = "https://github.com/SimplifyJobs/Summer2027-Internships";

/** How stale the mirror may get before a page view triggers a refresh. */
const MAX_AGE_HOURS = 12;
/** A sync that started this long ago is presumed dead and may be retried. */
const LOCK_MINUTES = 10;

/**
 * Ordering key, not a literal start date. Winter and Spring both begin in
 * January, so Spring is nudged a month later purely to keep the two from tying
 * and shuffling in the term list.
 */
const SEASON_START_MONTH: Record<string, number> = {
  winter: 1,
  spring: 2,
  summer: 5,
  fall: 9,
};

/** The source labels the same field several ways; collapse them for filtering. */
const CATEGORY_ALIASES: Record<string, string> = {
  "software": "Software Engineering",
  "software engineering": "Software Engineering",
  "ai/ml/data": "AI / ML / Data",
  "data science, ai & machine learning": "AI / ML / Data",
  "quant": "Quant Finance",
  "product": "Product Management",
  "hardware": "Hardware",
  "hardware engineering": "Hardware",
};

export const CATEGORIES = [
  "Software Engineering",
  "AI / ML / Data",
  "Quant Finance",
  "Product Management",
  "Hardware",
] as const;

export function normaliseCategory(raw: unknown): string {
  const key = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return CATEGORY_ALIASES[key] ?? "Other";
}

/** First day of a term, or null when the label isn't a recognised "Season Year". */
export function termStart(term: unknown): Date | null {
  if (typeof term !== "string") return null;
  const parts = term.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const month = SEASON_START_MONTH[parts[0].toLowerCase()];
  const year = Number(parts[1]);
  if (!month || !Number.isInteger(year)) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

interface SourceListing {
  id?: string;
  company_name?: string;
  title?: string;
  category?: string;
  url?: string;
  company_url?: string;
  locations?: string[];
  terms?: string[];
  date_posted?: number;
  active?: boolean;
  is_visible?: boolean;
}

interface Row {
  id: string;
  term: string;
  termStart: string;
  company: string;
  title: string;
  category: string;
  url: string;
  companyUrl: string | null;
  locations: string[];
  postedAt: string | null;
}

/** Flattens the source into one row per (listing, upcoming term). */
export function buildRows(listings: SourceListing[], now = new Date()): Row[] {
  // Terms that began before this month are in the past for our purposes.
  const floor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const rows: Row[] = [];

  for (const l of listings) {
    if (!l.active || !l.is_visible) continue;
    if (!l.id || !l.url || !l.company_name || !l.title) continue;

    for (const term of l.terms ?? []) {
      const start = termStart(term);
      if (!start || start.getTime() < floor) continue;

      rows.push({
        id: l.id,
        term,
        termStart: start.toISOString().slice(0, 10),
        company: l.company_name,
        title: l.title,
        category: normaliseCategory(l.category),
        url: l.url,
        companyUrl: l.company_url ?? null,
        locations: Array.isArray(l.locations) ? l.locations.slice(0, 12) : [],
        postedAt: l.date_posted ? new Date(l.date_posted * 1000).toISOString() : null,
      });
    }
  }
  return rows;
}

export async function lastSyncedAt(): Promise<Date | null> {
  const [row] = await db()`SELECT finished_at FROM internship_sync WHERE id = 1`;
  return row?.finished_at ? new Date(row.finished_at as string) : null;
}

export async function isStale(): Promise<boolean> {
  const at = await lastSyncedAt();
  if (!at) return true;
  return Date.now() - at.getTime() > MAX_AGE_HOURS * 3600_000;
}

/**
 * Refreshes the mirror. Returns the number of rows stored, or null when another
 * request already holds the lock — the caller just serves what's there.
 */
export async function syncInternships(): Promise<number | null> {
  const claimed = await db()`
    UPDATE internship_sync
       SET started_at = now()
     WHERE id = 1
       AND (started_at IS NULL OR started_at < now() - ${`${LOCK_MINUTES} minutes`}::interval)
    RETURNING id
  `;
  if (claimed.length === 0) return null;

  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`source responded ${res.status}`);
  const rows = buildRows((await res.json()) as SourceListing[]);

  const stamp = new Date().toISOString();

  // Chunked so a single statement never carries the whole list.
  for (let i = 0; i < rows.length; i += 250) {
    const chunk = rows.slice(i, i + 250);
    await db()`
      INSERT INTO internships
        (id, term, term_start, company, title, category, url, company_url, locations, posted_at, synced_at)
      SELECT * FROM unnest(
        ${chunk.map((r) => r.id)}::text[],
        ${chunk.map((r) => r.term)}::text[],
        ${chunk.map((r) => r.termStart)}::date[],
        ${chunk.map((r) => r.company)}::text[],
        ${chunk.map((r) => r.title)}::text[],
        ${chunk.map((r) => r.category)}::text[],
        ${chunk.map((r) => r.url)}::text[],
        ${chunk.map((r) => r.companyUrl)}::text[],
        ${chunk.map((r) => JSON.stringify(r.locations))}::jsonb[],
        ${chunk.map((r) => r.postedAt)}::timestamptz[],
        ${chunk.map(() => stamp)}::timestamptz[]
      )
      ON CONFLICT (id, term) DO UPDATE SET
        term_start  = EXCLUDED.term_start,
        company     = EXCLUDED.company,
        title       = EXCLUDED.title,
        category    = EXCLUDED.category,
        url         = EXCLUDED.url,
        company_url = EXCLUDED.company_url,
        locations   = EXCLUDED.locations,
        posted_at   = EXCLUDED.posted_at,
        synced_at   = EXCLUDED.synced_at
    `;
  }

  // Anything not touched by this run is closed, filled, or now in the past.
  await db()`DELETE FROM internships WHERE synced_at < ${stamp}`;

  await db()`
    UPDATE internship_sync
       SET finished_at = now(), started_at = NULL, count = ${rows.length}
     WHERE id = 1
  `;

  return rows.length;
}
