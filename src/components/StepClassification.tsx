"use client";

import { motion } from "framer-motion";
import { type StudentData, type Classification, CLASSIFICATION_LABELS, EXPECTED_SEMESTERS } from "@/lib/data";

interface Props {
  student: StudentData;
  onChange: (updates: Partial<StudentData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const YEAR_GROUPS: { year: string; options: Classification[] }[] = [
  { year: "Freshman",  options: ["frosh1",  "frosh2"]  },
  { year: "Sophomore", options: ["soph1",   "soph2"]   },
  { year: "Junior",    options: ["junior1", "junior2"] },
  { year: "Senior",    options: ["senior1", "senior2"] },
];

const YEAR_EMOJI: Record<string, string> = {
  Freshman: "🌱", Sophomore: "⚡", Junior: "🔥", Senior: "🎯",
};

const CREDIT_OPTIONS: { value: 12 | 15 | 18; label: string; sub: string; chip: string }[] = [
  { value: 12, label: "12 credits", sub: "Light load · manageable pace",      chip: "bg-blue-50 border-blue-200 text-blue-700"   },
  { value: 15, label: "15 credits", sub: "Standard load · on-time graduation", chip: "bg-green-50 border-green-200 text-green-700" },
  { value: 18, label: "18 credits", sub: "Max load · fastest path",            chip: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function StepClassification({ student, onChange, onNext, onBack }: Props) {
  const canContinue = !!student.classification && !!student.creditTarget;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Where are you in your journey?</h2>
      <p className="text-slate-500 text-sm mb-6">
        This tells us how many semesters you have left — including the one you're starting now.
      </p>

      {/* Classification cards grouped by year */}
      <div className="mb-7 space-y-4">
        {YEAR_GROUPS.map(({ year, options }, gi) => (
          <div key={year}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>{YEAR_EMOJI[year]}</span> {year}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((value, i) => {
                const active = student.classification === value;
                const semLabel = value.endsWith("1") ? "1st Semester" : "2nd Semester";
                const sems = EXPECTED_SEMESTERS[value];
                return (
                  <motion.button
                    key={value}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (gi * 2 + i) * 0.04 }}
                    onClick={() => onChange({ classification: value })}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                      active
                        ? "border-maroon-600 bg-maroon-50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-maroon-200 hover:bg-maroon-50/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${active ? "text-maroon-800" : "text-slate-700"}`}>
                        {semLabel}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sems} semester{sems !== 1 ? "s" : ""} to graduation
                      </p>
                    </div>
                    {active && (
                      <span className="h-5 w-5 rounded-full bg-maroon-600 flex items-center justify-center shrink-0">
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Credit load */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Credits per semester (target)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CREDIT_OPTIONS.map(({ value, label, sub, chip }, i) => {
            const active = student.creditTarget === value;
            return (
              <motion.button
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.05 }}
                onClick={() => onChange({ creditTarget: value })}
                className={`rounded-2xl border-2 px-3 py-4 text-left transition-all ${
                  active
                    ? "border-maroon-600 bg-maroon-50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-maroon-200 hover:bg-maroon-50/40"
                }`}
              >
                <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 border mb-2 ${chip}`}>
                  {label}
                </span>
                <p className="text-xs text-slate-500 leading-snug">{sub}</p>
                {active && (
                  <div className="mt-2 h-1 w-full rounded-full bg-maroon-200">
                    <div className="h-1 rounded-full bg-maroon-600" style={{ width: `${(value / 18) * 100}%` }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {student.creditTarget === 12 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2"
          >
            Note: if 12 credits isn&apos;t enough to finish within your timeline, we&apos;ll
            automatically raise the target and let you know.
          </motion.p>
        )}
      </div>

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="border border-slate-200 text-slate-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="bg-maroon-700 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-maroon-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
