import { NextRequest, NextResponse } from "next/server";
import { isAllowedEmail, normaliseEmail, safeNextPath, signMagicToken } from "@/lib/auth";
import { db } from "@/lib/db";

const LINK_TTL_MINUTES = 15;

const FROM = process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev";
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { email, next } = await req.json();
  const normalised = normaliseEmail(email);

  if (!normalised) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (!isAllowedEmail(normalised))
    return NextResponse.json({ error: "NotAllowed" }, { status: 403 });

  // A pending request lets the tab that asked for the link finish signing in,
  // even when the link is opened on a different device.
  let requestId: string | null = null;
  try {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + LINK_TTL_MINUTES * 60_000).toISOString();
    await db()`
      INSERT INTO login_requests (id, email, next_path, expires_at)
      VALUES (${id}, ${normalised}, ${safeNextPath(next)}, ${expiresAt})
    `;
    requestId = id;

    if (Math.random() < 0.05) {
      await db()`DELETE FROM login_requests WHERE expires_at < now() - interval '1 day'`;
    }
  } catch (err) {
    // Without a pending row the link still works on the device that opens it.
    console.error("login_requests insert failed:", err);
  }

  const token = await signMagicToken(normalised, next, requestId ?? undefined);
  const link = `${BASE_URL}/api/magic-link/verify?token=${encodeURIComponent(token)}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: normalised,
      subject: "Sign in to AAMU Degree Planner",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#7B0D1E;margin-bottom:8px">AAMU Degree Planner</h2>
          <p style="color:#475569;margin-bottom:24px">Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${link}" style="display:inline-block;background:#7B0D1E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Sign in</a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    let code = "EmailFailed";
    try {
      const parsed = JSON.parse(err);
      if (parsed?.name === "validation_error" || parsed?.message?.includes("You can only send")) {
        code = "SenderRestriction";
      }
    } catch { /* ignore */ }
    return NextResponse.json({ error: code, detail: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requestId });
}
