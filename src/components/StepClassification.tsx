"use client";

import { motion } from "framer-motion";
import { type StudentData, type Classification, EXPECTED_SEMESTERS } from "@/lib/data";

interface Props {
  student: StudentData;
  onChange: (updates: Partial<StudentData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Map semester count → classification key
const SEMS_TO_CLASSIFICATION: Record<number, Classification> = {
  8: "frosh1", 7: "frosh2",
  6: "soph1",  5: "soph2",
  4: "junior1", 3: "junior2",
  2: "senior1", 1: "senior2",
};

const CREDIT_OPTIONS: { value: 12 | 15 | 18; label: string; sub: string; chip: string }[] = [
  { value: 12, label: "12 credits", sub: "Light load · manageable pace",       chip: "bg-blue-50 border-blue-200 text-blue-700"    },
  { value: 15, label: "15 credits", sub: "Standard load · on-time graduation", chip: "bg-green-50 border-green-200 text-green-700"  },
  { value: 18, label: "18 credits", sub: "Max load · fastest path",            chip: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function StepClassification({ student, onChange, onNext, onBack }: Props) {
  const canContinue = !!student.classification && !!student.creditTarget;

  const selectedSems = student.classification
    ? EXPECTED_SEMESTERS[student.classification]
    : null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        How many semesters do you have left?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Include the one you&apos;re starting now. A standard 4-year degree is 8 semesters total.
      </p>

      {/* Semester count grid */}
      <div className="mb-7">
        <div className="grid grid-cols-4 gap-2">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((n, i) => {
            const active = selectedSems === n;
            return (
              <motion.button
                key={n}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onChange({ classification: SEMS_TO_CLASSIFICATION[n] })}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 py-4 transition-all ${
                  active
                    ? "border-maroon-600 bg-maroon-50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-maroon-200 hover:bg-maroon-50/40"
                }`}
              >
                <span className={`text-2xl font-bold ${active ? "text-maroon-700" : "text-slate-700"}`}>
                  {n}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {n === 1 ? "semester" : "semesters"}
                </span>
                {active && (
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-maroon-600" />
                )}
              </motion.button>
            );
          })}
        </div>
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
