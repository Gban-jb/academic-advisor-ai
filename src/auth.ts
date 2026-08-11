import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
      name: "AAMU Degree Planner",
    }),
  ],
  callbacks: {
    signIn({ user }) {
      if (!user.email) return false;
      if (ALLOWED_EMAILS.length === 0) return false;
      return ALLOWED_EMAILS.includes(user.email.toLowerCase());
    },
    jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    session({ session, token }) {
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?step=check-email",
    error: "/login",
  },
});
