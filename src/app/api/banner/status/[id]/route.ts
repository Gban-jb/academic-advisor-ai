import { NextRequest, NextResponse } from "next/server";

const SCRAPER_URL = process.env.SCRAPER_URL ?? "http://localhost:3001";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${SCRAPER_URL}/status/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
