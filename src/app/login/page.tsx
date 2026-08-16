"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const nextParam = params.get("next") ?? "/";
  const confirmed = params.get("confirmed") === "1";

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError]     = useState(
    errorParam === "expired" ? "That link has expired. Please request a new one." :
    errorParam === "missing" ? "Invalid sign-in link." : ""
  );

  // While the link is outstanding, watch for it being opened — on this device
  // or any other. Whichever tab is polling is the one that gets signed in.
  useEffect(() => {
    if (!requestId) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/magic-link/poll?id=${encodeURIComponent(requestId)}`);
        const data = await res.json();
        if (!active) return;
        if (data.status === "approved") {
          window.location.href = data.next || "/";
          return;
        }
        if (data.status === "expired") {
          setRequestId(null);
          setSent(false);
          setError("That sign-in request expired. Please request a new link.");
          return;
        }
      } catch {
        // Transient — the next tick tries again.
      }
      if (active) timer = setTimeout(poll, 2500);
    };

    let timer = setTimeout(poll, 2500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [requestId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), next: nextParam }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "NotAllowed") {
          setError(
            "Sign-in is limited to @bulldogs.aamu.edu and @gmail.com addresses."
          );
        } else if (data.error === "SenderRestriction") {
          setError(
            "We couldn't send to that address — our email sender isn't verified for it yet. Please try your Gmail instead."
          );
        } else {
          setError("Something went wrong sending the email. Please try again.");
        }
      } else {
        setSent(true);
        if (data.requestId) setRequestId(data.requestId);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #f8f6f0 0%, #f0ede6 100%)" }}>
      {/* Logo / Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}>
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AAMU Degree Planner</h1>
        <p className="text-sm text-slate-500 mt-1">Alabama A&amp;M University · CS Advising</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

        {confirmed ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-50 border border-green-100 mb-4">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">You&apos;re signed in</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Head back to the device where you started — it&apos;s signing you in now.
              You can close this tab.
            </p>
          </div>
        ) : sent ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-50 border border-green-100 mb-4">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              We sent a sign-in link to <strong className="text-slate-700">{email}</strong>.<br />
              Click the link to sign in — it expires in 15 minutes.
            </p>

            {requestId && (
              <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                <svg className="h-4 w-4 animate-spin text-maroon-700 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-xs text-slate-500 text-left leading-relaxed">
                  Waiting for you to open the link — you can open it on your phone and
                  this page will sign you in automatically.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Didn&apos;t get it? Check spam, or{" "}
              <button
                onClick={() => { setSent(false); setEmail(""); setRequestId(null); }}
                className="text-maroon-700 underline underline-offset-2 hover:text-maroon-900"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Sign in</h2>
              <p className="text-sm text-slate-500">
                Enter your email and we&apos;ll send you a sign-in link — no password needed.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Only <strong className="font-medium text-slate-500">@bulldogs.aamu.edu</strong> and{" "}
                <strong className="font-medium text-slate-500">@gmail.com</strong> addresses are accepted.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="firstname.lastname@bulldogs.aamu.edu"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-maroon-400 focus:ring-2 focus:ring-maroon-100 disabled:opacity-60 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3">
                  <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending link…
                  </span>
                ) : (
                  "Send sign-in link"
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Sign-in is restricted to AAMU Bulldogs and Gmail addresses.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
