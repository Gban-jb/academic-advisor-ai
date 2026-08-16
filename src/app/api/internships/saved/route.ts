import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/api-auth";
import { db } from "@/lib/db";

const MAX_SAVED = 200;

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

/**
 * A student's saved listings, newest first.
 *
 * `stillListed` is false once a posting has left the board — closed, filled, or
 * its term has passed. The saved copy is still shown so nobody wonders where
 * their bookmark went.
 */
export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const rows = await db()`
    SELECT s.listing_id, s.term, s.company, s.title, s.url, s.category, s.saved_at,
           i.id IS NOT NULL AS still_listed,
           i.locations, i.degrees, i.sponsorship, i.posted_at
      FROM saved_internships s
      LEFT JOIN internships i ON i.id = s.listing_id AND i.term = s.term
     WHERE s.email = ${email}
     ORDER BY s.saved_at DESC
  `;

  return NextResponse.json(
    {
      saved: rows.map((r) => ({
        id: r.listing_id,
        term: r.term,
        company: r.company,
        title: r.title,
        url: r.url,
        category: r.category,
        savedAt: r.saved_at,
        stillListed: r.still_listed,
        locations: r.locations ?? [],
        degrees: r.degrees ?? [],
        sponsorship: r.sponsorship ?? null,
        postedAt: r.posted_at ?? null,
      })),
    },
    { headers: noStore }
  );
}

/** Save a listing. Details are copied from the board rather than trusted from the client. */
export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  let body: { id?: unknown; term?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }
  if (typeof body.id !== "string" || typeof body.term !== "string") {
    return NextResponse.json({ error: "id and term required" }, { status: 400, headers: noStore });
  }

  const [{ count }] = await db()`
    SELECT count(*)::int AS count FROM saved_internships WHERE email = ${email}
  `;
  if (count >= MAX_SAVED) {
    return NextResponse.json(
      { error: `You can save up to ${MAX_SAVED} listings.` },
      { status: 409, headers: noStore }
    );
  }

  const [listing] = await db()`
    SELECT company, title, url, category FROM internships
     WHERE id = ${body.id} AND term = ${body.term}
  `;
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404, headers: noStore });
  }

  await db()`
    INSERT INTO saved_internships (email, listing_id, term, company, title, url, category)
    VALUES (${email}, ${body.id}, ${body.term}, ${listing.company}, ${listing.title},
            ${listing.url}, ${listing.category})
    ON CONFLICT (email, listing_id, term) DO NOTHING
  `;

  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  const term = req.nextUrl.searchParams.get("term");
  if (!id || !term) {
    return NextResponse.json({ error: "id and term required" }, { status: 400, headers: noStore });
  }

  await db()`
    DELETE FROM saved_internships
     WHERE email = ${email} AND listing_id = ${id} AND term = ${term}
  `;
  return NextResponse.json({ ok: true }, { headers: noStore });
}
