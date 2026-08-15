"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── types ────────────────────────────────────────────────────────────────────

interface Course {
  courseTitle?: string;
  title?: string;
  subjectCode?: string;
  courseNumber?: string;
  section?: string;
  description?: string;
  termCode?: string;
  termDescription?: string;
  finalGrade?: string | null;
  historyFinalGrade?: string | null;
  hoursAttempted?: string;
  hoursEarned?: string | null;
  qualityPoints?: string | null;
  registrationStatus?: string;
  instructor?: string;
  instructorEmail?: string;
  crn?: string;
  hours?: number;
}

interface BannerData {
  studentId: string;
  name: string;
  email: string;
  classStanding: string;
  status: string;
  campus: string;
  firstTerm: string;
  lastTerm: string;
  curriculum: {
    degree?: string;
    program?: string;
    college?: string;
    major?: string;
    concentration?: string;
    catalogTerm?: string;
    admitType?: string;
  };
  gpa: {
    overall: string;
    institutional: string;
    transfer: string;
    totalHours: number;
    gpaHours: number;
  };
  holds: number;
  registrationNotices: number;
  currentCourses: Course[];
  courseHistory: Course[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  A: "text-emerald-700 bg-emerald-50 border-emerald-200",
  B: "text-blue-700 bg-blue-50 border-blue-200",
  C: "text-amber-700 bg-amber-50 border-amber-200",
  D: "text-orange-700 bg-orange-50 border-orange-200",
  F: "text-red-700 bg-red-50 border-red-200",
};

function gradeColor(grade: string | null | undefined) {
  if (!grade) return "text-slate-400 bg-slate-50 border-slate-200";
  const letter = grade.charAt(0).toUpperCase();
  return GRADE_COLOR[letter] || "text-slate-700 bg-slate-50 border-slate-200";
}

function termLabel(tc: string) {
  if (!tc) return tc;
  const year = tc.slice(0, 4);
  const sem = tc.slice(4);
  if (sem === "10") return `Spring ${year}`;
  if (sem === "70") return `Fall ${year}`;
  if (sem === "40") return `Summer ${year}`;
  return tc;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function BannerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<BannerData | null>(null);
  const [tab, setTab] = useState<"overview" | "history">("overview");

  useEffect(() => {
    const raw = sessionStorage.getItem("bannerData");
    if (!raw) { router.push("/banner"); return; }
    try { setData(JSON.parse(raw)); } catch { router.push("/banner"); }
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f6f0" }}>
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-red-800 border-t-transparent" />
      </div>
    );
  }

  // Group course history by term
  const termMap = new Map<string, Course[]>();
  for (const c of data.courseHistory) {
    const key = c.termCode || c.termDescription || "Unknown";
    if (!termMap.has(key)) termMap.set(key, []);
    termMap.get(key)!.push(c);
  }
  const terms = Array.from(termMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const completedCredits = data.courseHistory
    .filter((c) => c.hoursEarned && parseFloat(c.hoursEarned) > 0)
    .reduce((s, c) => s + parseFloat(c.hoursEarned!), 0);

  return (
    <div className="min-h-screen" style={{ background: "#f0ede8", fontFamily: "system-ui, sans-serif" }}>

      {/* ── top bar ── */}
      <header style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="h-7 w-7 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
          <div>
            <p className="text-white font-bold text-base leading-tight">AAMU Degree Planner</p>
            <p className="text-red-200 text-xs">Banner SSB Dashboard</p>
          </div>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("bannerData"); router.push("/banner"); }}
          className="text-xs text-red-200 hover:text-white border border-red-400 hover:border-white rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out of Banner
        </button>
      </header>

      {/* ── alerts ── */}
      {(data.holds > 0 || data.registrationNotices > 0) && (
        <div className="px-6 pt-4 space-y-2">
          {data.holds > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="h-4 w-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">You have {data.holds} active hold{data.holds > 1 ? "s" : ""} on your account</p>
            </div>
          )}
          {data.registrationNotices > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-sm text-amber-700 font-medium">{data.registrationNotices} registration notice{data.registrationNotices > 1 ? "s" : ""} require your attention</p>
            </div>
          )}
        </div>
      )}

      {/* ── profile card ── */}
      <div className="px-6 pt-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            {/* avatar */}
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
            >
              {data.name.charAt(0)}
            </div>
            {/* info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800 truncate">{data.name}</h1>
              <p className="text-sm text-slate-500">{data.studentId} · {data.email || data.studentId + "@bulldogs.aamu.edu"}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5 font-medium">
                  {data.classStanding || "Student"}
                </span>
                <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
                  {data.curriculum?.program || data.curriculum?.major || "Computer Science"}
                </span>
                <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
                  {data.status || "Active"}
                </span>
              </div>
            </div>
            {/* GPA */}
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#7B0D1E" }}>{data.gpa.overall}</p>
                <p className="text-xs text-slate-500">Overall GPA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-700">{completedCredits}</p>
                <p className="text-xs text-slate-500">Credits Earned</p>
              </div>
            </div>
          </div>

          {/* curriculum strip */}
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex flex-wrap gap-x-6 gap-y-1">
            {[
              ["Degree", data.curriculum?.degree],
              ["Major", data.curriculum?.major],
              ["Concentration", data.curriculum?.concentration],
              ["College", data.curriculum?.college],
              ["Admit Type", data.curriculum?.admitType],
              ["Catalog Term", data.curriculum?.catalogTerm],
              ["First Term", data.firstTerm],
              ["Last Term", data.lastTerm],
            ].map(([label, value]) => value && value !== "Not Provided" ? (
              <div key={label} className="flex gap-1 text-xs">
                <span className="text-slate-500">{label}:</span>
                <span className="text-slate-700 font-medium">{value}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="px-6 pt-5 flex gap-1">
        {(["overview", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? "bg-white text-red-800 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "overview" ? "Current Semester" : "Course History"}
          </button>
        ))}
      </div>

      {/* ── content ── */}
      <div className="px-6 pt-4 pb-10">

        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Currently Enrolled</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.currentCourses.length} course{data.currentCourses.length !== 1 ? "s" : ""} · {data.currentCourses.reduce((s, c) => s + (c.hours || 0), 0)} credit hours
                  </p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-1 font-medium">
                  In Progress
                </span>
              </div>

              {data.currentCourses.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No courses found for current term</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {data.currentCourses.map((c, i) => (
                    <div key={i} className="px-6 py-4 flex items-start gap-4">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
                      >
                        {(c.description || "").split(" ")[0] || "CS"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.description} · CRN {c.crn}</p>
                        {c.instructor && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="text-slate-400">Instructor:</span>{" "}
                            <a
                              href={`mailto:${c.instructorEmail}`}
                              className="hover:underline"
                              style={{ color: "#7B0D1E" }}
                            >
                              {c.instructor}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-700">{c.hours} cr</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.registrationStatus?.replace(/\*\*/g, "")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPA breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Institutional GPA", value: data.gpa.institutional, sub: `${data.gpa.gpaHours} hrs` },
                { label: "Transfer GPA", value: data.gpa.transfer, sub: "Transfer hours" },
                { label: "Overall GPA", value: data.gpa.overall, sub: `${data.gpa.totalHours} total hrs` },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: "#7B0D1E" }}>{item.value}</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            {terms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-400">
                No course history found
              </div>
            ) : (
              terms.map(([termCode, courses]) => {
                const label = courses[0]?.termDescription || termLabel(termCode);
                const termGpa = courses.filter(c => c.qualityPoints && parseFloat(c.qualityPoints) > 0);
                const totalQP = termGpa.reduce((s, c) => s + parseFloat(c.qualityPoints!), 0);
                const totalGPAHrs = termGpa.reduce((s, c) => s + (c.hoursEarned ? parseFloat(c.hoursEarned) : 0), 0);
                const termGpaVal = totalGPAHrs > 0 ? (totalQP / totalGPAHrs).toFixed(2) : null;

                return (
                  <div key={termCode} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
                        <span className="text-xs text-slate-400">{courses.length} course{courses.length > 1 ? "s" : ""}</span>
                      </div>
                      {termGpaVal && (
                        <span className="text-xs font-semibold" style={{ color: "#7B0D1E" }}>
                          Term GPA {termGpaVal}
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50">
                      {courses.map((c, i) => {
                        const grade = c.finalGrade || c.historyFinalGrade;
                        const name = c.courseTitle || c.title || "—";
                        const code = c.subjectCode && c.courseNumber
                          ? `${c.subjectCode} ${c.courseNumber}${c.section ? ` §${c.section}` : ""}`
                          : c.description || "";

                        return (
                          <div key={i} className="px-6 py-3 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                              <p className="text-xs text-slate-400">{code}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-slate-500">
                                {c.hoursAttempted ? `${parseFloat(c.hoursAttempted).toFixed(0)} cr` : ""}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold border ${gradeColor(grade)}`}
                              >
                                {grade || "—"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
