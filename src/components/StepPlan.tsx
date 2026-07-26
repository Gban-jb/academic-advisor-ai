"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COURSES, CREDIT_MAX, EXPECTED_SEMESTERS, type StudentData } from "@/lib/data";
import { buildSchedule, type ScheduledSemester } from "@/lib/scheduler";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import AdvisorReport from "@/components/AdvisorReport";

interface Props {
  student: StudentData;
  onStudentChange: (updates: Partial<StudentData>) => void;
  onBack: () => void;
}

const LOAD: Record<ScheduledSemester["load"], { label: string; chip: string; bar: string }> = {
  light:    { label: "Light",   chip: "bg-gold-100 text-gold-700",    bar: "bg-gold-400" },
  standard: { label: "Full",    chip: "bg-green-100 text-green-700",  bar: "bg-green-500" },
  full:     { label: "Full",    chip: "bg-green-100 text-green-700",  bar: "bg-green-500" },
  max:      { label: "Max",     chip: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
};
const CONC = { AI: "Artificial Intelligence", CYB: "Cybersecurity", GCS: "General CS" };

export default function StepPlan({ student, onStudentChange, onBack }: Props) {
  const result = useMemo(() => {
    if (student.earlyGraduation === false) {
      return buildSchedule(student, {
        overrideSemesters: EXPECTED_SEMESTERS[student.classification],
      });
    }
    return buildSchedule(student);
  }, [student]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Your Degree Plan</h2>
          <p className="text-slate-500 text-sm mt-1">
            {student.name} · {CONC[student.concentration]} · graduates{" "}
            <span className="font-semibold text-maroon-800">{result.graduationSemester}</span>
          </p>
        </div>
        <button onClick={() => window.print()}
          className="no-print text-sm border border-slate-200 text-slate-600 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
          </svg>
          Print
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Credits Done", value: result.completedCredits, dec: 0, grad: "from-maroon-600 to-maroon-800" },
          { label: "Remaining", value: 125 - result.completedCredits, dec: 0, grad: "from-gold-500 to-gold-700" },
          { label: "Semesters Left", value: result.semesters.length, dec: 0, grad: "from-slate-600 to-slate-800" },
          { label: "GPA", value: student.gpa, dec: 2, grad: "from-maroon-500 to-maroon-700" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl p-4 overflow-hidden bg-white border border-slate-100 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.grad}`} />
            <div className="text-3xl font-bold text-slate-900">
              <AnimatedNumber value={s.value} decimals={s.dec} />
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Early graduation banner */}
      <AnimatePresence>
        {result.earlyGraduationPossible && student.earlyGraduation === undefined && (
          <motion.div
            key="early-grad"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800 text-sm">
                  You could graduate{" "}
                  {result.expectedSemesters - result.semesters.length} semester(s) early — in{" "}
                  <span className="font-bold">{result.graduationSemester}</span>!
                </p>
                <p className="text-xs text-green-600 mt-0.5 mb-3">
                  Would you like to keep this accelerated plan, or spread your courses out over
                  the full {result.expectedSemesters} semesters?
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onStudentChange({ earlyGraduation: true })}
                    className="bg-green-700 text-white text-xs font-semibold rounded-xl px-4 py-2 hover:bg-green-800 transition-colors"
                  >
                    Yes, graduate early ✓
                  </button>
                  <button
                    onClick={() => onStudentChange({ earlyGraduation: false })}
                    className="border border-green-300 text-green-800 text-xs font-semibold rounded-xl px-4 py-2 hover:bg-green-100 transition-colors"
                  >
                    No, spread it out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {student.earlyGraduation === true && (
          <motion.div
            key="early-yes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2.5"
          >
            <span>🎓</span>
            <p className="text-sm text-green-800">
              <span className="font-semibold">Early graduation selected.</span> Your accelerated
              plan is shown below.
            </p>
            <button
              onClick={() => onStudentChange({ earlyGraduation: undefined })}
              className="ml-auto text-xs text-green-600 underline hover:text-green-800 shrink-0"
            >
              Reconsider
            </button>
          </motion.div>
        )}

        {student.earlyGraduation === false && (
          <motion.div
            key="early-no"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-2.5"
          >
            <span>📅</span>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Spread-out plan.</span> Credits ramp up gradually
              so each semester stays manageable.
            </p>
            <button
              onClick={() => onStudentChange({ earlyGraduation: undefined })}
              className="ml-auto text-xs text-blue-600 underline hover:text-blue-800 shrink-0"
            >
              Reconsider
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit target override notice */}
      {result.creditTargetOverridden && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5"
        >
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">
              Credit load raised to {result.effectiveCreditTarget}/semester.
            </span>{" "}
            Your chosen target isn&apos;t enough to finish within{" "}
            {result.expectedSemesters} semesters, so we&apos;ve increased it to keep
            you on track.
          </p>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative pl-6">
        {/* vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-maroon-300 via-slate-200 to-gold-300" />

        <div className="space-y-4">
          {result.semesters.map((sem, i) => {
            const fillPct = Math.min(100, (sem.totalCredits / CREDIT_MAX) * 100);
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative">
                {/* node */}
                <div className="absolute -left-6 top-4 h-3.5 w-3.5 rounded-full bg-white border-2 border-maroon-600 shadow" />

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-soft transition-shadow">
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-maroon-700 bg-maroon-100 rounded-full h-6 w-6 flex items-center justify-center">{i + 1}</span>
                      <span className="font-semibold text-slate-800 text-sm">{sem.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-slate-500">{sem.totalCredits} cr</span>
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${LOAD[sem.load].chip}`}>{LOAD[sem.load].label}</span>
                    </div>
                  </div>

                  {/* load bar */}
                  <div className="h-1 bg-slate-100">
                    <motion.div className={`h-1 ${LOAD[sem.load].bar}`}
                      initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }} />
                  </div>

                  {/* courses */}
                  <div className="divide-y divide-slate-50">
                    {sem.courses.map((code) => {
                      const course = COURSES[code];
                      const isRetake = sem.retakes.includes(code);
                      return (
                        <div key={code} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{code}</span>
                            <span className="text-sm text-slate-700 truncate">{course?.title ?? code}</span>
                            {isRetake && <span className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-md px-1.5 py-0.5 font-medium shrink-0">Retake</span>}
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{course?.credits ?? 3} cr</span>
                        </div>
                      );
                    })}
                    {sem.courses.length === 0 && <div className="px-4 py-3 text-sm text-slate-400">No courses scheduled.</div>}
                  </div>

                  {sem.warnings.length > 0 && (
                    <div className="px-4 py-2 bg-gold-50 border-t border-gold-100">
                      {sem.warnings.map((w, j) => <p key={j} className="text-xs text-gold-800">{w}</p>)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* graduation cap node */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: result.semesters.length * 0.08 + 0.2 }}
          className="relative mt-4">
          <div className="absolute -left-[26px] top-1 h-7 w-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-sm shadow-soft">🎓</div>
          <p className="text-sm font-semibold text-maroon-800 pl-1">Graduation · {result.graduationSemester}</p>
        </motion.div>
      </div>

      {/* AI Advisor Report */}
      <AdvisorReport student={student} scheduleResult={result} />

      {/* Nav */}
      <div className="flex justify-between mt-8 no-print">
        <button onClick={onBack} className="border border-slate-200 text-slate-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
      </div>
    </div>
  );
}
