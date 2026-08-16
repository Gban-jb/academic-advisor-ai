import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** This route is public, so it's the one endpoint an anonymous caller could run up. */
const HOURLY_LIMIT = 60;

// Fetch course descriptions from Pinecone by vector ID.
// IDs follow the pattern built by build_full_rag_database.py:
//   "CS 102" → "course_CS_102"
function toPineconeId(code: string): string {
  return `course_${code.replace(/\s+/g, "_")}`;
}

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(`course-info:${clientIp(req)}`, HOURLY_LIMIT, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAt: limit.resetAt.toISOString() },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000)),
          },
        }
      );
    }
  } catch {
    // A database hiccup shouldn't take the catalog down; fail open.
  }

  const { courseCodes }: { courseCodes: string[] } = await req.json();

  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;

  if (!pineconeKey || !pineconeHost || !courseCodes?.length) {
    return NextResponse.json({ descriptions: {} });
  }

  try {
    // Use Pinecone REST fetch API to retrieve vectors by ID (no embedding needed)
    const ids = courseCodes.map(toPineconeId);
    const url = `${pineconeHost}/vectors/fetch?${ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`;

    const res = await fetch(url, {
      headers: {
        "Api-Key": pineconeKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Pinecone fetch error:", res.status, await res.text());
      return NextResponse.json({ descriptions: {} });
    }

    const data = await res.json();
    const vectors: Record<string, { metadata?: Record<string, unknown> }> =
      data.vectors ?? {};

    const descriptions: Record<string, { title: string; description: string; credits: number; prereqs: string }> = {};

    for (const [vecId, vec] of Object.entries(vectors)) {
      const meta = vec.metadata ?? {};
      // Reconstruct course code from vector ID: course_CS_102 → CS 102
      const code = String(meta.code ?? vecId.replace(/^course_/, "").replace(/_(\d)/, " $1"));
      descriptions[code] = {
        title: String(meta.title ?? ""),
        description: String(meta.text_summary ?? ""),
        credits: Number(meta.credits ?? 3),
        prereqs: String(meta.prerequisites_raw ?? "None"),
      };
    }

    return NextResponse.json({ descriptions });
  } catch (err) {
    console.error("course-info error:", err);
    return NextResponse.json({ descriptions: {} });
  }
}
