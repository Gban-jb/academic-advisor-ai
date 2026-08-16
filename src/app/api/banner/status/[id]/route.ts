import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_URL ?? "http://localhost:3001";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = await requireSession(req);
  if (unauthorized) return unauthorized;

  const res = await fetch(`${SCRAPER_URL}/status/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
