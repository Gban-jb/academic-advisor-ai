"use client";

import { usePathname } from "next/navigation";

/** Small fixed sign-out control, hidden on the login screen itself. */
export default function SignOutButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  return (
    <form action="/api/magic-link/logout" method="post" className="fixed top-4 right-4 z-50">
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-maroon-200 hover:text-maroon-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        Sign out
      </button>
    </form>
  );
}
