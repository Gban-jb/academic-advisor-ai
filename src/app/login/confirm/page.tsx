"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "loading" | "ready" | "approved" | "cancelled" | "unavailable";

function Confirm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("unavailable");
      return;
    }
    let active = true;
    fetch(`/api/magic-link/approve?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (!d || d.status !== "pending") {
          setState("unavailable");
          return;
        }
        setCode(d.code ?? null);
        setEmail(d.email ?? "");
        setState("ready");
      })
      .catch(() => active && setState("unavailable"));
    return () => {
      active = false;
    };
  }, [token]);

  async function approve() {
    setWorking(true);
    try {
      const res = await fetch("/api/magic-link/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? "approved" : "unavailable");
    } catch {
      setState("unavailable");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #f8f6f0 0%, #f0ede6 100%)" }}
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AAMU Degree Planner</h1>
        <p className="mt-1 text-sm text-slate-500">Confirm your sign-in</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
        {state === "loading" && <p className="text-sm text-slate-500">Checking that link…</p>}

        {state === "ready" && (
          <>
            <p className="mb-1 text-sm text-slate-500">
              Signing in <strong className="text-slate-700">{email}</strong>
            </p>
            <p className="mb-5 text-sm leading-relaxed text-slate-500">
              Does this code match the one on the device where you started?
            </p>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 py-5">
              <span className="font-mono text-4xl font-bold tracking-[0.3em] text-maroon-800">
                {code ?? "----"}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={approve}
                disabled={working}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
              >
                {working ? "Confirming…" : "Yes, it matches"}
              </button>
              <button
                onClick={() => setState("cancelled")}
                disabled={working}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 disabled:opacity-50"
              >
                No
              </button>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-400">
              If you didn&apos;t start a sign-in, or the codes differ, choose No — someone
              else may be trying to sign in as you.
            </p>
          </>
        )}

        {state === "approved" && (
          <>
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-50">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">You&apos;re signed in</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Head back to the device where you started — it&apos;s signing you in now.
              You can close this tab.
            </p>
          </>
        )}

        {state === "cancelled" && (
          <>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">Sign-in cancelled</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Nothing was approved. If you didn&apos;t request this, you can ignore the
              email — the link expires on its own.
            </p>
          </>
        )}

        {state === "unavailable" && (
          <>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">This link isn&apos;t active</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              It may have expired, or already been used. Sign-in links last 15 minutes.
            </p>
            <a
              href="/login"
              className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
            >
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  );
}
