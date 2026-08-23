import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { cleanName } from "@/lib/plan-name";

/** Enough for real scenario-comparison without letting one account fill the table. */
const MAX_PLANS_PER_STUDENT = 20;

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

/** Every plan belonging to the signed-in student, most recently opened first. */
export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const rows = await db()`
    SELECT id, name, step, updated_at, last_opened_at
      FROM plans
     WHERE email = ${email}
     ORDER BY last_opened_at DESC NULLS LAST, updated_at DESC
  `;

  return NextResponse.json(
    {
      plans: rows.map((r) => ({
        id: r.id,
        name: r.name,
        step: r.step,
        updatedAt: r.updated_at,
        lastOpenedAt: r.last_opened_at,
      })),
    },
    { headers: noStore }
  );
}

/**
 * Create a plan. With `fromId` it duplicates that plan instead of starting
 * empty — the point of the feature is changing one thing without losing the
 * version you already built.
 */
export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  let body: { name?: unknown; fromId?: unknown; data?: unknown; step?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is a valid "give me a blank plan".
  }

  const [{ count }] = await db()`SELECT count(*)::int AS count FROM plans WHERE email = ${email}`;
  if (count >= MAX_PLANS_PER_STUDENT) {
    return NextResponse.json(
      { error: `You can keep up to ${MAX_PLANS_PER_STUDENT} plans. Delete one to make room.` },
      { status: 409, headers: noStore }
    );
  }

  const id = crypto.randomUUID();

  if (typeof body.fromId === "string") {
    const [source] = await db()`
      SELECT name, data, step FROM plans WHERE id = ${body.fromId} AND email = ${email}
    `;
    if (!source) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404, headers: noStore });
    }
    const name = cleanName(body.name, `${source.name} (copy)`);
    await db()`
      INSERT INTO plans (id, email, name, data, step, last_opened_at)
      VALUES (${id}, ${email}, ${name}, ${JSON.stringify(source.data)}::jsonb, ${source.step}, now())
    `;
    return NextResponse.json({ id, name }, { headers: noStore });
  }

  const name = cleanName(body.name, "New plan");
  const data = body.data && typeof body.data === "object" ? body.data : {};
  const step = Number.isInteger(body.step) ? (body.step as number) : 0;

  await db()`
    INSERT INTO plans (id, email, name, data, step, last_opened_at)
    VALUES (${id}, ${email}, ${name}, ${JSON.stringify(data)}::jsonb, ${step}, now())
  `;
  return NextResponse.json({ id, name }, { headers: noStore });
}

/** Wipe all plans for the signed-in student — called at the start of each new session. */
export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();
  await db()`DELETE FROM plans WHERE email = ${email}`;
  return NextResponse.json({ ok: true }, { headers: noStore });
}
