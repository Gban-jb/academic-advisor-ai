import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** A plan is a few hundred courses at worst; anything larger is not a real plan. */
const MAX_PLAN_BYTES = 256 * 1024;

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** The student's saved plan, or `plan: null` if they haven't made one yet. */
export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const rows = await db()`
    SELECT data, step, updated_at FROM plans WHERE email = ${email}
  `;
  const row = rows[0];
  return NextResponse.json(
    { plan: row ? { data: row.data, step: row.step, updatedAt: row.updated_at } : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/** Upsert — one plan per student, overwritten as they work. */
export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  let body: { data?: unknown; step?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "data must be an object" }, { status: 400 });
  }

  const serialised = JSON.stringify(body.data);
  if (serialised.length > MAX_PLAN_BYTES) {
    return NextResponse.json({ error: "Plan too large" }, { status: 413 });
  }

  const step = Number.isInteger(body.step) ? (body.step as number) : 0;

  await db()`
    INSERT INTO plans (email, data, step, updated_at)
    VALUES (${email}, ${serialised}::jsonb, ${step}, now())
    ON CONFLICT (email) DO UPDATE
      SET data = EXCLUDED.data, step = EXCLUDED.step, updated_at = now()
  `;

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}

/** Lets a student start over from scratch. */
export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  await db()`DELETE FROM plans WHERE email = ${email}`;
  return NextResponse.json({ ok: true });
}
