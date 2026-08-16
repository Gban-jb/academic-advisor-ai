"use client";

import { useEffect } from "react";

/**
 * Planner-specific boundary. Sits closer to the failure than the root one so a
 * crash mid-wizard keeps the student on the planner rather than the homepage,
 * and reassures them their work is already saved server-side.
 */
export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Planner error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-lg font-semibold text-slate-800">The planner hit a snag</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          Your plan is saved — reloading won&apos;t lose the courses you entered.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
          >
            Reload the planner
          </button>
          <a
            href="/"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
          >
            Back to home
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-slate-400">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
