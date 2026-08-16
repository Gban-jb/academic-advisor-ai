import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const unauthorized = await requireSession(req);
  if (unauthorized) return unauthorized;

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const res = await fetch(`${SCRAPER_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
