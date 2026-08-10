"use client";

import { useMemo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  COURSES, CREDIT_MAX, EXPECTED_SEMESTERS, FILLER_POOL,
  gradeIsPassing, gradeIsRegistered,
  type StudentData,
} from "@/lib/data";
import { buildSchedule, type ScheduledSemester, type ScheduleResult } from "@/lib/scheduler";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import AdvisorReport from "@/components/AdvisorReport";
import ChatBot from "@/components/ChatBot";

interface CourseInfo {
  title: string;
  description: string;
  credits: number;
  prereqs: string;
}

interface Props {
  student: StudentData;
  onStudentChange: (updates: Partial<StudentData>) => void;
  onBack: () => void;
}

const LOAD: Record<ScheduledSemester["load"], { label: string; chip: string; bar: string }> = {
  light:    { label: "Light",    chip: "bg-gold-100 text-gold-700",     bar: "bg-gold-400" },
  standard: { label: "Full",     chip: "bg-green-100 text-green-700",   bar: "bg-green-500" },
  full:     { label: "Full",     chip: "bg-green-100 text-green-700",   bar: "bg-green-500" },
  max:      { label: "Max",      chip: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
};

const CONC = { AI: "Artificial Intelligence", CYB: "Cybersecurity", GCS: "General CS" };

const FILLER_GROUPS = [
  { label: "Fine Arts & Humanities", codes: ["MUS 101", "ART 101", "COMM 101", "PHL 201", "PHL 203"] },
  { label: "Languages",              codes: ["SPA 101", "FRE 101"] },
  { label: "Social Sciences",        codes: ["PSY 201", "SOC 201", "SOC 210", "GEO 213", "UPL 103"] },
  { label: "History",                codes: ["HIS 101", "HIS 102", "HIS 201", "HIS 202"] },
  { label: "Literature",             codes: ["ENG 201", "ENG 202", "ENG 203", "ENG 204", "ENG 207", "ENG 208"] },
  { label: "CS Electives",           codes: ["CS 304", "CS 320", "CS 330", "CS 311", "CS 315", "CS 328", "CS 435"] },
];

export default function StepPlan({ student, onStudentChange, onBack }: Props) {
  const computed = useMemo<ScheduleResult>(() => {
    if (student.earlyGraduation === false) {
      return buildSchedule(student, {
        overrideSemesters: EXPECTED_SEMESTERS[student.classification],
      });
    }
    return buildSchedule(student);
  }, [student]);

  // chatOverride lets the chatbot replace semesters without touching the student object
  const [chatOverride, setChatOverride] = useState<ScheduledSemester[] | null>(null);
  // Reset chatbot changes whenever the base schedule is recomputed
  useEffect(() => { setChatOverride(null); }, [computed]);

  const result: ScheduleResult = chatOverride
    ? { ...computed, semesters: chatOverride }
    : computed;

  // RAG course description enrichment
  const [ragInfo, setRagInfo] = useState<Record<string, CourseInfo>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    const allCodes = result.semesters.flatMap((s) => s.courses);
    if (allCodes.length === 0) return;
    fetch("/api/course-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseCodes: allCodes }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.descriptions) setRagInfo(data.descriptions); })
      .catch(() => {});
  }, [result]);

  // Interest course picker state
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [pickedInterests, setPickedInterests] = useState<string[]>([]);

  // Which filler courses are actually available (not already done/registered)
  const doneCodes = useMemo(() => {
    const s = new Set<string>();
    for (const t of student.transcript) {
      if (gradeIsPassing(t.grade) || gradeIsRegistered(t.grade)) s.add(t.code);
    }
    return s;
  }, [student.transcript]);

  const availableFillerCodes = useMemo(
    () => FILLER_POOL.filter((c) => !doneCodes.has(c)),
    [doneCodes]
  );

  // Show prompts only once — hide after student has answered
  const needsInterestPrompt =
    result.semesters.some((s) => s.fillerCourses.length > 0 || s.isExtension) &&
    student.interestCourses === undefined;

  const hasExtensionSemesters = result.semesters.some((s) => s.isExtension);
  const needsExtensionPrompt =
    hasExtensionSemesters && student.extensionCreditTarget === undefined;

  const toggleInterest = (code: string) =>
    setPickedInterests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const confirmInterests = () => {
    onStudentChange({ interestCourses: pickedInterests });
    setShowInterestPicker(false);
  };

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
        <button
          onClick={() => window.print()}
          className="no-print text-sm border border-slate-200 text-slate-600 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
          </svg>
          Print
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Credits Done",   value: result.completedCredits,        dec: 0, grad: "from-maroon-600 to-maroon-800" },
          { label: "Remaining",      value: 125 - result.completedCredits,  dec: 0, grad: "from-gold-500 to-gold-700" },
          { label: "Semesters Left", value: result.semesters.length,        dec: 0, grad: "from-slate-600 to-slate-800" },
          { label: "GPA",            value: student.gpa,                    dec: 2, grad: "from-maroon-500 to-maroon-700" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl p-4 overflow-hidden bg-white border border-slate-100 shadow-sm"
          >
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
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
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
                  Keep this accelerated plan, or spread your courses out over the full{" "}
                  {result.expectedSemesters} semesters?
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2.5"
          >
            <span>🎓</span>
            <p className="text-sm text-green-800">
              <span className="font-semibold">Early graduation selected.</span> Your accelerated plan is shown below.
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-2.5"
          >
            <span>📅</span>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Spread-out plan.</span> Credits ramp up gradually so each semester stays manageable.
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5"
        >
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">
              Credit load raised to {result.effectiveCreditTarget}/semester.
            </span>{" "}
            Your chosen target isn&apos;t enough to finish within {result.expectedSemesters} semesters,
            so we&apos;ve increased it to keep you on track.
          </p>
        </motion.div>
      )}

      {/* Extension credit target prompt */}
      <AnimatePresence>
        {needsExtensionPrompt && (
          <motion.div
            key="ext-target"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="font-semibold text-amber-800 text-sm mb-0.5">
              Extension semesters added to fill your full {result.expectedSemesters}-semester plan.
            </p>
            <p className="text-xs text-amber-600 mb-3">
              How many credits would you like to take each extension semester?
            </p>
            <div className="flex gap-2 flex-wrap">
              {([12, 15, 18] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => onStudentChange({ extensionCreditTarget: n })}
                  className={`text-xs font-semibold rounded-xl px-4 py-2 border transition-colors ${
                    n === 12
                      ? "bg-amber-700 text-white border-amber-700 hover:bg-amber-800"
                      : "border-amber-300 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {n} credits{n === 12 ? " (recommended)" : ""}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interest course picker prompt */}
      <AnimatePresence>
        {needsInterestPrompt && (
          <motion.div
            key="interest-prompt"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <p className="font-semibold text-slate-800 text-sm mb-0.5">
              Some semesters need extra courses to reach 12 credits.
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Would you like to choose interest courses (e.g. Spanish, Music, Psychology)?
              We&apos;ll schedule those instead of generic electives.
            </p>

            {!showInterestPicker ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInterestPicker(true)}
                  className="bg-maroon-700 text-white text-xs font-semibold rounded-xl px-4 py-2 hover:bg-maroon-800 transition-colors"
                >
                  Yes, let me choose
                </button>
                <button
                  onClick={() => onStudentChange({ interestCourses: [] })}
                  className="border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2 hover:bg-slate-100 transition-colors"
                >
                  No, auto-fill is fine
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-3">
                  Select courses you&apos;d like to take:
                </p>
                <div className="space-y-4 mb-4">
                  {FILLER_GROUPS.map((group) => {
                    const groupCodes = group.codes.filter((c) => availableFillerCodes.includes(c));
                    if (groupCodes.length === 0) return null;
                    return (
                      <div key={group.label}>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {groupCodes.map((code) => {
                            const selected = pickedInterests.includes(code);
                            return (
                              <button
                                key={code}
                                onClick={() => toggleInterest(code)}
                                className={`text-xs rounded-lg border px-3 py-1.5 transition-colors font-medium ${
                                  selected
                                    ? "bg-maroon-700 text-white border-maroon-700"
                                    : "border-slate-200 text-slate-600 hover:border-maroon-300 hover:text-maroon-700"
                                }`}
                              >
                                {COURSES[code]?.title ?? code}
                                <span className="ml-1 opacity-60">{COURSES[code]?.credits ?? 3}cr</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmInterests}
                    className="bg-maroon-700 text-white text-xs font-semibold rounded-xl px-4 py-2 hover:bg-maroon-800 transition-colors"
                  >
                    Confirm selection ({pickedInterests.length} chosen)
                  </button>
                  <button
                    onClick={() => { onStudentChange({ interestCourses: [] }); setShowInterestPicker(false); }}
                    className="border border-slate-300 text-slate-600 text-xs font-semibold rounded-xl px-4 py-2 hover:bg-slate-100 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-maroon-300 via-slate-200 to-gold-300" />

        <div className="space-y-4">
          {result.semesters.map((sem, i) => {
            const fillPct = Math.min(100, (sem.totalCredits / CREDIT_MAX) * 100);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative"
              >
                {/* timeline node */}
                <div className={`absolute -left-6 top-4 h-3.5 w-3.5 rounded-full bg-white border-2 shadow ${
                  sem.isExtension ? "border-amber-400" : "border-maroon-600"
                }`} />

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-soft transition-shadow">
                  {/* Extension semester banner */}
                  {sem.isExtension && (
                    <div className="bg-amber-50 px-4 py-1.5 border-b border-amber-100">
                      <p className="text-xs text-amber-700 font-medium">
                        Extension semester — elective coursework beyond required completion
                      </p>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-maroon-700 bg-maroon-100 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm">{sem.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-slate-500">{sem.totalCredits} cr</span>
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${LOAD[sem.load].chip}`}>
                        {LOAD[sem.load].label}
                      </span>
                    </div>
                  </div>

                  {/* Load bar */}
                  <div className="h-1 bg-slate-100">
                    <motion.div
                      className={`h-1 ${LOAD[sem.load].bar}`}
                      initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
                    />
                  </div>

                  {/* Courses */}
                  <div className="divide-y divide-slate-50">
                    {sem.courses.map((code) => {
                      const course = COURSES[code];
                      const isRetake = sem.retakes.includes(code);
                      const isFiller = sem.fillerCourses.includes(code);
                      const rag = ragInfo[code];
                      const isOpen = expandedCourse === code;
                      return (
                        <div key={code}>
                          <button
                            onClick={() => setExpandedCourse(isOpen ? null : code)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{code}</span>
                              <span className="text-sm text-slate-700 truncate">
                                {course?.title ?? rag?.title ?? code}
                              </span>
                              {isRetake && (
                                <span className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-md px-1.5 py-0.5 font-medium shrink-0">
                                  Retake
                                </span>
                              )}
                              {isFiller && (
                                <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-md px-1.5 py-0.5 font-medium shrink-0">
                                  Added for 12-credit min
                                </span>
                              )}
                              {rag && !isFiller && (
                                <span className="text-[10px] bg-maroon-50 text-maroon-500 border border-maroon-100 rounded-md px-1.5 py-0.5 font-medium shrink-0">
                                  RAG
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-400">
                                {course?.credits ?? rag?.credits ?? 3} cr
                              </span>
                              {rag && (
                                <span className="text-slate-300 text-xs">{isOpen ? "▲" : "▼"}</span>
                              )}
                            </div>
                          </button>
                          {isOpen && rag && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 pb-3 bg-slate-50/50 border-t border-slate-100"
                            >
                              {rag.description && (
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rag.description}</p>
                              )}
                              {rag.prereqs && rag.prereqs !== "None" && (
                                <p className="text-xs text-slate-400 mt-1.5">
                                  <span className="font-medium text-slate-500">Prerequisites:</span> {rag.prereqs}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                    {sem.courses.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-400">No courses scheduled.</div>
                    )}
                  </div>

                  {sem.warnings.length > 0 && (
                    <div className="px-4 py-2 bg-gold-50 border-t border-gold-100">
                      {sem.warnings.map((w, j) => (
                        <p key={j} className="text-xs text-gold-800">{w}</p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Graduation node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: result.semesters.length * 0.08 + 0.2 }}
          className="relative mt-4"
        >
          <div className="absolute -left-[26px] top-1 h-7 w-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-sm shadow-soft">
            🎓
          </div>
          <p className="text-sm font-semibold text-maroon-800 pl-1">
            Graduation · {result.graduationSemester}
          </p>
        </motion.div>
      </div>

      {/* AI Advisor Report */}
      <AdvisorReport student={student} scheduleResult={result} />

      {/* Nav */}
      <div className="flex justify-between mt-8 no-print">
        <button
          onClick={onBack}
          className="border border-slate-200 text-slate-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* AI Chatbot — floats in bottom-right, can edit the schedule live */}
      <ChatBot
        student={student}
        semesters={result.semesters}
        onScheduleChange={setChatOverride}
      />
    </div>
  );
}
