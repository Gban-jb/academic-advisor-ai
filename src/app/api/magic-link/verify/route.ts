import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=missing", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const email = payload.email as string;
    if (!email) throw new Error("no email");

    // Create a session JWT (7 days)
    const { SignJWT } = await import("jose");
    const session = await new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(SECRET);

    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("authjs.session-token", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    // Also set the __Secure- prefixed version for production HTTPS
    if (process.env.NODE_ENV === "production") {
      res.cookies.set("__Secure-authjs.session-token", session, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }
}
