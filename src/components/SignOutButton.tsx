"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const pill =
  "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-maroon-200 hover:text-maroon-700";

/** Shows "Sign out" to signed-in visitors and "Sign in" to everyone else. */
export default function SignOutButton() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => active && setAuthed(Boolean(d.authenticated)))
      .catch(() => active && setAuthed(false));
    return () => {
      active = false;
    };
  }, [pathname]);

  // Nothing to offer on the login screen, and no flicker before we know.
  if (pathname.startsWith("/login") || authed === null) return null;

  if (!authed) {
    return (
      <a href={`/login?next=${encodeURIComponent(pathname)}`} className={`fixed top-4 right-4 z-50 ${pill}`}>
        Sign in
      </a>
    );
  }

  return (
    <form action="/api/magic-link/logout" method="post" className="fixed top-4 right-4 z-50">
      <button type="submit" className={pill}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        Sign out
      </button>
    </form>
  );
}
