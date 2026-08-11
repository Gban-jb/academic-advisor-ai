import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
const FROM = process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev";
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const normalised = (email ?? "").trim().toLowerCase();

  if (!normalised) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (!ALLOWED.includes(normalised))
    return NextResponse.json({ error: "NotAllowed" }, { status: 403 });

  // Sign a 15-minute token
  const token = await new SignJWT({ email: normalised })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(SECRET);

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
    return NextResponse.json({ error: "EmailFailed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
