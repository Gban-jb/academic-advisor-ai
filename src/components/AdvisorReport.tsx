"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StudentData } from "@/lib/data";
import type { AdvisorReport } from "@/lib/advisor-types";
import type { ScheduleResult } from "@/lib/scheduler";

interface Props {
  student: StudentData;
  scheduleResult: ScheduleResult;
}

type Tab = "summary" | "concentration" | "nextsem" | "roadmap" | "warnings";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "concentration", label: "Concentration" },
  { id: "nextsem", label: "Next Semester" },
  { id: "roadmap", label: "Full Roadmap" },
  { id: "warnings", label: "Warnings" },
];

const PRIORITY_COLOR: Record<string, string> = {
  required: "bg-maroon-100 text-maroon-700",
  concentration: "bg-blue-100 text-blue-700",
  math: "bg-purple-100 text-purple-700",
  recommended: "bg-green-100 text-green-700",
};

const STANDING_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  caution: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  at_risk: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const TYPE_COLOR: Record<string, string> = {
  core: "bg-maroon-50 text-maroon-700 border border-maroon-100",
  concentration: "bg-blue-50 text-blue-700 border border-blue-100",
  math: "bg-purple-50 text-purple-700 border border-purple-100",
  gen_ed: "bg-slate-50 text-slate-600 border border-slate-100",
  elective: "bg-green-50 text-green-700 border border-green-100",
};

export default function AdvisorReport({ student, scheduleResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("summary");

  async function generate() {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, scheduleResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setReport(data.report);
      setTab("summary");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  function exportPDF() {
    if (!report) return;
    sessionStorage.setItem(
      "advisor_report",
      JSON.stringify({ report, student, scheduleResult })
    );
    window.open("/report-print", "_blank");
  }

  const warningCount = report?.prerequisiteWarnings.length ?? 0;

  return (
    <div className="mt-10 border-t border-slate-100 pt-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800 flex items-center justify-center text-xs text-white font-bold shadow-sm">
              AI
            </span>
            AI Advising Report
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Powered by GPT-4o mini · AAMU 2025-2026 Bulletin
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {report && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Download PDF
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={generate}
            disabled={loading || student.transcript.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-maroon-700 to-maroon-800 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-soft transition-shadow"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing…
              </>
            ) : (
              <>{report ? "Regenerate Report" : "Generate AI Report"}</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} className={`h-4 bg-slate-100 rounded-full`} style={{ width: `${w}%` }} />
          ))}
          <p className="text-xs text-slate-400 mt-4 text-center">
            Running tool analysis → building your personalized report…
          </p>
        </div>
      )}

      {/* Report content */}
      {report && !loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 min-w-fit text-xs font-semibold rounded-xl px-3 py-2 transition-all whitespace-nowrap ${
                  tab === t.id
                    ? "bg-white text-maroon-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                {t.id === "warnings" && warningCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.5">
                    {warningCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── SUMMARY ── */}
              {tab === "summary" && (
                <div className="space-y-4">
                  {/* Standing banner */}
                  {(() => {
                    const s = STANDING_COLOR[report.studentSummary.academicStanding] ?? STANDING_COLOR.good;
                    return (
                      <div className={`${s.bg} ${s.border} border rounded-2xl px-5 py-4`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${s.text} mb-1`}>
                          Academic Standing · {report.studentSummary.academicStanding.replace("_", " ")}
                        </p>
                        <p className={`text-sm ${s.text}`}>{report.studentSummary.standingNote}</p>
                      </div>
                    );
                  })()}

                  {/* Stat grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Credits Done", value: report.studentSummary.creditsCompleted, color: "from-maroon-600 to-maroon-800" },
                      { label: "Credits Left", value: report.studentSummary.creditsRemaining, color: "from-gold-500 to-gold-700" },
                      { label: "GPA", value: student.gpa.toFixed(2), color: "from-blue-500 to-blue-700" },
                      { label: "Graduating", value: report.studentSummary.estimatedGraduation, color: "from-emerald-500 to-emerald-700", small: true },
                    ].map((s) => (
                      <div key={s.label} className="relative rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden p-4">
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.color}`} />
                        <div className={`font-bold text-slate-900 ${s.small ? "text-base leading-tight mt-1" : "text-2xl"}`}>
                          {s.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Insights */}
                  <div className="bg-gradient-to-br from-maroon-50 to-gold-50 rounded-2xl p-5 border border-maroon-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-maroon-700 mb-3">
                      Personalized Insights
                    </p>
                    <ul className="space-y-2">
                      {report.aiInsights.map((insight, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                          <span className="text-maroon-500 font-bold shrink-0 mt-0.5">→</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Concerns */}
                  {report.concerns.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">
                        Raise with your Advisor
                      </p>
                      <ul className="space-y-1">
                        {report.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-amber-800 flex gap-2">
                            <span className="font-bold shrink-0">!</span>{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ── CONCENTRATION ── */}
              {tab === "concentration" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                      Recommended Concentration
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {report.concentrationAnalysis.recommended === "CYB" ? "Cybersecurity" :
                       report.concentrationAnalysis.recommended === "AI" ? "Artificial Intelligence" :
                       "General Computer Science"}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {report.concentrationAnalysis.recommendationReason}
                    </p>
                  </div>

                  {report.concentrationAnalysis.fits.map((fit) => (
                    <div key={fit.code} className={`rounded-2xl border p-4 bg-white shadow-sm ${
                      fit.code === report.concentrationAnalysis.recommended
                        ? "border-blue-300 ring-1 ring-blue-200"
                        : "border-slate-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{fit.name}</p>
                          <p className="text-xs text-slate-400">{fit.code} · {fit.totalRequired} courses required</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-maroon-700">{fit.completionPercentage}%</p>
                          <p className="text-xs text-slate-400">{fit.completedCount}/{fit.totalRequired} done</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className="h-2 bg-gradient-to-r from-maroon-500 to-maroon-700 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fit.completionPercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      {fit.remainingCourses.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Still needed:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {fit.remainingCourses.map((c) => (
                              <span key={c} className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!fit.meetsGpaRequirement && (
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                          GPA below 2.0 minimum — must raise GPA to declare this concentration
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── NEXT SEMESTER ── */}
              {tab === "nextsem" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                      Recommended for your next enrollment
                    </p>
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl px-3 py-1">
                      {report.nextSemesterPlan.reduce((s, c) => s + c.credits, 0)} credits
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.nextSemesterPlan.map((course, i) => (
                      <motion.div
                        key={course.code}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                      >
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-800 flex flex-col items-center justify-center text-white shadow-sm">
                          <span className="text-xs font-bold">{course.code.split(" ")[0]}</span>
                          <span className="text-base font-bold leading-none">{course.code.split(" ")[1]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 text-sm">{course.name}</p>
                            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${PRIORITY_COLOR[course.priority] ?? "bg-slate-100 text-slate-600"}`}>
                              {course.priority}
                            </span>
                            <span className="text-xs text-slate-400">{course.credits} cr</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{course.reason}</p>
                          {!course.prerequisitesMet && (
                            <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-0.5">
                              Warning: prerequisites may not be met
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── FULL ROADMAP ── */}
              {tab === "roadmap" && (
                <div className="relative pl-5">
                  <div className="absolute left-[6px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-maroon-300 via-slate-200 to-gold-300" />
                  <div className="space-y-4">
                    {report.fullRoadmap.map((sem, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative"
                      >
                        <div className="absolute -left-5 top-4 h-3 w-3 rounded-full bg-white border-2 border-maroon-500 shadow-sm" />
                        <div className="border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-maroon-700 bg-maroon-100 rounded-full h-5 w-5 flex items-center justify-center">
                                {sem.semesterNumber}
                              </span>
                              <span className="font-semibold text-sm text-slate-800">{sem.semesterLabel}</span>
                            </div>
                            <span className="text-xs text-slate-400">{sem.totalCredits} credits</span>
                          </div>
                          <div className="p-3 flex flex-wrap gap-2">
                            {sem.courses.map((c) => (
                              <span key={c.code} className={`text-xs font-mono rounded-lg px-2.5 py-1 ${TYPE_COLOR[c.type] ?? "bg-slate-50 text-slate-600"}`}>
                                {c.code} <span className="opacity-60">{c.credits}cr</span>
                              </span>
                            ))}
                          </div>
                          {sem.notes && (
                            <p className="text-xs text-slate-400 px-4 pb-2.5">{sem.notes}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div className="relative mt-3">
                      <div className="absolute -left-5 top-1 h-6 w-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-xs shadow-soft">🎓</div>
                      <p className="text-sm font-semibold text-maroon-800 pl-1">
                        Graduation · {report.studentSummary.estimatedGraduation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WARNINGS ── */}
              {tab === "warnings" && (
                <div>
                  {report.prerequisiteWarnings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-semibold text-slate-700">No prerequisite issues detected</p>
                      <p className="text-sm text-slate-400 mt-1">All registered courses appear properly sequenced.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.prerequisiteWarnings.map((w, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`rounded-2xl border p-4 ${
                            w.severity === "error"
                              ? "bg-red-50 border-red-200"
                              : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`text-lg shrink-0 mt-0.5 ${w.severity === "error" ? "text-red-500" : "text-amber-500"}`}>
                              {w.severity === "error" ? "⛔" : "⚠️"}
                            </span>
                            <div>
                              <p className={`font-semibold text-sm ${w.severity === "error" ? "text-red-800" : "text-amber-800"}`}>
                                {w.course} — {w.courseName}
                              </p>
                              <p className={`text-sm mt-0.5 ${w.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
                                {w.issue}
                              </p>
                              {w.missingPrereqs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <span className="text-xs text-slate-500">Missing:</span>
                                  {w.missingPrereqs.map((p) => (
                                    <span key={p} className="text-xs font-mono bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className={`text-xs mt-2 font-medium ${w.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
                                → {w.recommendation}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty state */}
      {!report && !loading && student.transcript.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">
          Add courses in Step 1 before generating your AI report.
        </p>
      )}
    </div>
  );
}
