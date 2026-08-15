"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BannerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"form" | "waiting" | "scraping" | "error">("form");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [dots, setDots] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setStep("waiting");
    setError("");

    try {
      const res = await fetch("/api/banner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start login");

      setSessionId(data.sessionId);
      pollStatus(data.sessionId);
    } catch (err: unknown) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      setDots((d) => (d + 1) % 4);
      try {
        const res = await fetch(`/api/banner/status/${id}`);
        if (!res.ok) { clearInterval(interval); setStep("error"); setError("Session expired"); return; }

        const data = await res.json();

        if (data.status === "scraping") {
          setStep("scraping");
        } else if (data.status === "done") {
          clearInterval(interval);
          sessionStorage.setItem("bannerData", JSON.stringify(data.data));
          router.push("/banner/dashboard");
        } else if (data.status === "error") {
          clearInterval(interval);
          setStep("error");
          setError(data.error || "An error occurred");
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 2000);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #f8f6f0 0%, #f0ede6 100%)" }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
          style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
        >
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AAMU Student Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Connect your Banner SSB account</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {step === "form" && (
          <>
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Sign in with AAMU</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enter your AAMU username. You&apos;ll get a push notification on your{" "}
                <span className="font-medium text-slate-700">Octopus Authenticator</span> app to approve.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">AAMU Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="firstname.lastname"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1.5">Format: firstname.lastname (e.g. jeeban.bashyal)</p>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
              >
                Connect Banner Account
              </button>
            </form>
          </>
        )}

        {(step === "waiting" || step === "scraping") && (
          <div className="p-8 text-center">
            {/* Animated spinner */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: "#7B0D1E transparent transparent transparent" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#7B0D1E" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 4.5h3" />
                  </svg>
                </div>
              </div>
            </div>

            {step === "waiting" ? (
              <>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your phone</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  A push notification was sent to your{" "}
                  <span className="font-medium text-slate-700">Octopus Authenticator</span> app.{" "}
                  Approve it to continue.
                </p>
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span className="text-xs text-amber-700">Waiting for approval{".".repeat(dots + 1)}</span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Fetching your data</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Pulling your grades, schedule, and profile from Banner SSB{".".repeat(dots + 1)}
                </p>
              </>
            )}

            <button
              onClick={() => { setStep("form"); setError(""); setSessionId(""); }}
              className="mt-6 text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
            >
              Cancel and try again
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50 border border-red-100 mb-4">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Authentication failed</h2>
            <p className="text-sm text-red-600 leading-relaxed mb-6">{error}</p>
            <button
              onClick={() => { setStep("form"); setError(""); }}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Your AAMU credentials are used only to fetch your Banner data and are never stored.
      </p>
    </div>
  );
}
