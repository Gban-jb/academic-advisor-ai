import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStale, lastSyncedAt, syncInternships } from "@/lib/internships";

const PAGE_SIZE = 30;

/** Listings with no stated degree are treated as open to undergrads. */
const BACHELORS = "Bachelor's";

/**
 * Public listing feed. Data is served from our mirror; if the mirror has gone
 * stale the request refreshes it first, but only when there's nothing to show —
 * otherwise stale results go out immediately and the refresh happens behind it.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const term = p.get("term") ?? "";
  const category = p.get("category") ?? "";
  const q = (p.get("q") ?? "").trim();
  const degree = p.get("degree") ?? "";
  const page = Math.max(1, Number(p.get("page")) || 1);

  try {
    const [{ count }] = await db()`SELECT count(*)::int AS count FROM internships`;
    if (count === 0) {
      await syncInternships();
    } else if (await isStale()) {
      syncInternships().catch((e) => console.error("internship sync failed:", e));
    }
  } catch (err) {
    console.error("internship sync check failed:", err);
  }

  const like = q ? `%${q}%` : null;
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db()`
    SELECT id, term, company, title, category, url, company_url, locations,
           degrees, sponsorship, posted_at, source_updated_at
      FROM internships
     WHERE (${term} = '' OR term = ${term})
       AND (${category} = '' OR category = ${category})
       AND (${degree} = '' OR degrees @> ${JSON.stringify([degree])}::jsonb
            OR (${degree} = ${BACHELORS} AND degrees = '[]'::jsonb))
       AND (${like}::text IS NULL OR company ILIKE ${like} OR title ILIKE ${like}
            OR locations::text ILIKE ${like})
     ORDER BY posted_at DESC NULLS LAST, company ASC
     LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const [{ total }] = await db()`
    SELECT count(*)::int AS total
      FROM internships
     WHERE (${term} = '' OR term = ${term})
       AND (${category} = '' OR category = ${category})
       AND (${degree} = '' OR degrees @> ${JSON.stringify([degree])}::jsonb
            OR (${degree} = ${BACHELORS} AND degrees = '[]'::jsonb))
       AND (${like}::text IS NULL OR company ILIKE ${like} OR title ILIKE ${like}
            OR locations::text ILIKE ${like})
  `;

  const termFacets = await db()`
    SELECT term, min(term_start) AS start, count(*)::int AS count
      FROM internships GROUP BY term ORDER BY min(term_start) ASC
  `;
  const categoryFacets = await db()`
    SELECT category, count(*)::int AS count
      FROM internships GROUP BY category ORDER BY count(*) DESC
  `;

  // The source lists a long tail of one-off degree labels (MD, JD, Bootcamp…);
  // only the levels a CS student would actually filter by are worth a chip.
  const degreeFacets = await db()`
    SELECT d.value AS degree, count(*)::int AS count
      FROM internships, jsonb_array_elements_text(degrees) AS d(value)
     GROUP BY d.value HAVING count(*) >= 10 ORDER BY count(*) DESC LIMIT 5
  `;

  return NextResponse.json(
    {
      listings: rows.map((r) => ({
        id: r.id,
        term: r.term,
        company: r.company,
        title: r.title,
        category: r.category,
        url: r.url,
        companyUrl: r.company_url,
        locations: r.locations ?? [],
        degrees: r.degrees ?? [],
        sponsorship: r.sponsorship,
        postedAt: r.posted_at,
        sourceUpdatedAt: r.source_updated_at,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      terms: termFacets.map((t) => ({ term: t.term, count: t.count })),
      categories: categoryFacets.map((c) => ({ category: c.category, count: c.count })),
      degrees: degreeFacets.map((d) => ({ degree: d.degree, count: d.count })),
      syncedAt: await lastSyncedAt(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
