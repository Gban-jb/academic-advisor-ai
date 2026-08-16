"use client";

import { useEffect } from "react";

/**
 * Catches render errors anywhere under `/` so a single thrown error shows a
 * recoverable screen instead of a blank page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303-1.5a9 9 0 11-18 0 9 9 0 0118 0zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mb-2 text-lg font-semibold text-slate-800">Something went wrong</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          Sorry — that wasn&apos;t supposed to happen. Your saved plan is safe.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-slate-400">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
