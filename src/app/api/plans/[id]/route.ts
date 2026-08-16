import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { cleanName } from "@/lib/plan-name";

/** A plan is a few hundred courses at worst; anything larger is not a real plan. */
const MAX_PLAN_BYTES = 256 * 1024;

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
const notFound = () =>
  NextResponse.json({ error: "Plan not found" }, { status: 404, headers: noStore });

type Ctx = { params: { id: string } };

/**
 * Load one plan. Every query carries `email` alongside the id, so a valid id
 * belonging to somebody else simply doesn't match.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const [row] = await db()`
    UPDATE plans SET last_opened_at = now()
     WHERE id = ${params.id} AND email = ${email}
    RETURNING id, name, data, step, updated_at
  `;
  if (!row) return notFound();

  return NextResponse.json(
    {
      plan: {
        id: row.id,
        name: row.name,
        data: row.data,
        step: row.step,
        updatedAt: row.updated_at,
      },
    },
    { headers: noStore }
  );
}

/** Save a plan's contents. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  let body: { data?: unknown; step?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "data must be an object" }, { status: 400, headers: noStore });
  }

  const serialised = JSON.stringify(body.data);
  if (serialised.length > MAX_PLAN_BYTES) {
    return NextResponse.json({ error: "Plan too large" }, { status: 413, headers: noStore });
  }

  const step = Number.isInteger(body.step) ? (body.step as number) : 0;

  const [row] = await db()`
    UPDATE plans
       SET data = ${serialised}::jsonb, step = ${step}, updated_at = now()
     WHERE id = ${params.id} AND email = ${email}
    RETURNING id
  `;
  if (!row) return notFound();

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() }, { headers: noStore });
}

/** Rename. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }

  const name = cleanName(body.name, "");
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400, headers: noStore });
  }

  const [row] = await db()`
    UPDATE plans SET name = ${name}, updated_at = now()
     WHERE id = ${params.id} AND email = ${email}
    RETURNING id, name
  `;
  if (!row) return notFound();

  return NextResponse.json({ id: row.id, name: row.name }, { headers: noStore });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const [row] = await db()`
    DELETE FROM plans WHERE id = ${params.id} AND email = ${email} RETURNING id
  `;
  if (!row) return notFound();

  return NextResponse.json({ ok: true }, { headers: noStore });
}
