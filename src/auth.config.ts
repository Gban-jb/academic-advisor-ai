import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Node.js-only imports (no pg, no adapter).
// Used by middleware to verify JWT without touching the database.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?step=check-email",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") || path.startsWith("/api/auth");
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  providers: [],
};
