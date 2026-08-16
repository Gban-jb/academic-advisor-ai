"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The one navigation bar for the whole site: brand, the two pillars
 * (graduation planning and career perspectives), and auth.
 */
export default function SiteNav() {
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

  // The print report is a document, and login is a focused full-screen flow.
  if (pathname.startsWith("/report-print") || pathname.startsWith("/login")) return null;

  const links = [
    { href: "/planner", label: "Graduation", active: pathname.startsWith("/planner") },
    {
      href: "/careers",
      label: "Careers",
      active: pathname.startsWith("/careers") || pathname.startsWith("/internships"),
    },
  ];

  return (
    <header className="no-print sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
          >
            <svg className="h-4.5 w-4.5 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </span>
          {/* On phones the logo mark alone is the brand — the text would crowd the links. */}
          <span className="hidden min-w-0 sm:block">
            <span className="block whitespace-nowrap text-sm font-bold leading-tight text-maroon-900">
              The Advising Place
            </span>
            <span className="block text-[10px] leading-tight text-slate-400">
              Alabama A&amp;M University
            </span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                l.active
                  ? "bg-maroon-50 text-maroon-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-maroon-700"
              }`}
            >
              {l.label}
            </a>
          ))}

          {authed === null ? (
            <span className="w-16" aria-hidden />
          ) : authed ? (
            <form action="/api/magic-link/logout" method="post">
              <button
                type="submit"
                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-maroon-200 hover:text-maroon-700 sm:text-sm"
              >
                Sign out
              </button>
            </form>
          ) : (
            <a
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
              style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
            >
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
