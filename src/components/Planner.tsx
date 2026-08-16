"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EMPTY_STUDENT, YEAR1_SEM1_COURSES, type StudentData, type Concentration } from "@/lib/data";
import StepClassification from "@/components/StepClassification";
import StepEntry from "@/components/StepEntry";
import StepReview from "@/components/StepReview";
import StepConcentration from "@/components/StepConcentration";
import StepPlan from "@/components/StepPlan";
import PlanSwitcher, { type PlanSummary } from "@/components/PlanSwitcher";

const STEPS = ["Standing", "Courses", "Review", "Concentration", "Plan"] as const;

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 40 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d * -40 }),
};

interface Props {
  onExit: () => void;
}

export default function Planner({ onExit }: Props) {
  const [step, setStep]       = useState(0);
  const [dir,  setDir]        = useState(1);
  const [student, setStudent] = useState<StudentData>(EMPTY_STUDENT);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Nothing is written back until a plan has loaded, otherwise the empty
  // starting state would overwrite real work on first render.
  const [restored, setRestored] = useState(false);
  const lastSaved = useRef<string>("");

  /** Replace the editor's contents without letting the autosave fire on the swap. */
  function adoptPlan(plan: { id: string; data: StudentData; step: number }) {
    setRestored(false);
    lastSaved.current = JSON.stringify({ data: plan.data, step: plan.step });
    setStudent(plan.data ?? EMPTY_STUDENT);
    setStep(typeof plan.step === "number" ? plan.step : 0);
    setCurrentId(plan.id);
    setSaveState("idle");
    setRestored(true);
  }

  async function loadPlan(id: string) {
    const res = await fetch(`/api/plans/${id}`);
    if (!res.ok) return;
    const { plan } = await res.json();
    adoptPlan({ id: plan.id, data: plan.data as StudentData, step: plan.step });
  }

  async function refreshList(): Promise<PlanSummary[]> {
    const res = await fetch("/api/plans");
    if (!res.ok) return [];
    const { plans: list } = await res.json();
    setPlans(list);
    return list;
  }

  // First load: open the most recently used plan, creating one if this is a
  // student's first visit.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await refreshList();
        if (!active) return;

        if (list.length === 0) {
          const created = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "My plan" }),
          });
          if (!created.ok) return;
          const { id } = await created.json();
          await refreshList();
          if (active) adoptPlan({ id, data: EMPTY_STUDENT, step: 0 });
          return;
        }

        await loadPlan(list[0].id);
      } catch {
        // Leave the planner usable offline; saving simply won't happen.
      } finally {
        if (active) setRestored(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored || !currentId) return;
    const payload = JSON.stringify({ data: student, step });
    if (payload === lastSaved.current) return;

    // Debounced so typing in the transcript doesn't fire a write per keystroke.
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/plans/${currentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (!res.ok) throw new Error(String(res.status));
        lastSaved.current = payload;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [student, step, restored, currentId]);

  async function withBusy(fn: () => Promise<void>) {
    setSwitching(true);
    try {
      await fn();
    } finally {
      setSwitching(false);
    }
  }

  const handleSwitch = (id: string) =>
    withBusy(async () => {
      await loadPlan(id);
      await refreshList();
    });

  const handleCreate = () =>
    withBusy(async () => {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Plan ${plans.length + 1}` }),
      });
      if (!res.ok) return;
      const { id } = await res.json();
      await refreshList();
      adoptPlan({ id, data: EMPTY_STUDENT, step: 0 });
    });

  const handleDuplicate = () =>
    withBusy(async () => {
      if (!currentId) return;
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: currentId }),
      });
      if (!res.ok) return;
      const { id } = await res.json();
      await refreshList();
      await loadPlan(id);
    });

  const handleRename = (name: string) =>
    withBusy(async () => {
      if (!currentId) return;
      await fetch(`/api/plans/${currentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await refreshList();
    });

  const handleDelete = () =>
    withBusy(async () => {
      if (!currentId || plans.length <= 1) return;
      const name = plans.find((p) => p.id === currentId)?.name ?? "this plan";
      if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
      await fetch(`/api/plans/${currentId}`, { method: "DELETE" });
      const list = await refreshList();
      if (list.length > 0) await loadPlan(list[0].id);
    });

  const go = (target: number) => {
    setDir(target > step ? 1 : -1);
    setStep(Math.max(0, Math.min(target, STEPS.length - 1)));
  };
  const next = () => go(step + 1);
  const back = () => (step === 0 ? onExit() : go(step - 1));

  // When Classification is confirmed, auto-fill freshman 1st-sem courses
  const handleClassificationNext = () => {
    if (student.classification === "frosh1") {
      // Pre-fill standard first-semester courses; student can still edit them
      setStudent((s) => ({ ...s, transcript: YEAR1_SEM1_COURSES, gpa: s.gpa || 0 }));
    }
    next();
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center shadow-soft">
            <span className="text-gold-300 font-bold text-lg">
              {student.name ? student.name[0].toUpperCase() : "A"}
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-maroon-900 leading-none">
              {student.name ? student.name : "The Lab"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">AAMU · BS Computer Science · Degree Planner</p>
          </div>
        </div>
        <div className="no-print flex items-center gap-3">
          <PlanSwitcher
            plans={plans}
            currentId={currentId}
            onSwitch={handleSwitch}
            onCreate={handleCreate}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            onDelete={handleDelete}
            busy={switching}
          />
          {saveState !== "idle" && (
            <span
              className={`text-xs ${saveState === "error" ? "text-red-600" : "text-slate-400"}`}
              title={saveState === "error" ? "We couldn't save your latest changes" : undefined}
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Not saved"}
            </span>
          )}
          <button onClick={onExit} className="text-sm text-slate-500 hover:text-maroon-700 transition-colors">
            ← Exit
          </button>
        </div>
      </motion.header>

      {/* Stepper */}
      <div className="mb-8 no-print">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 -z-0" />
          <motion.div
            className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-maroon-600 to-gold-400 -z-0"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          {STEPS.map((label, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <button key={label} onClick={() => i < step && go(i)} disabled={i > step}
                className="relative z-10 flex flex-col items-center gap-2">
                <motion.span
                  animate={{
                    scale: active ? 1.12 : 1,
                    backgroundColor: active ? "#7c1530" : done ? "#9e234b" : "#ffffff",
                    color: active || done ? "#ffffff" : "#94a3b8",
                    borderColor: active || done ? "#7c1530" : "#e2e8f0",
                  }}
                  transition={{ duration: 0.3 }}
                  className={`h-8 w-8 rounded-full border-2 text-sm font-semibold flex items-center justify-center shadow-sm ${
                    i <= step ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </motion.span>
                <span className={`text-xs font-medium transition-colors hidden sm:block ${
                  active ? "text-maroon-800" : done ? "text-maroon-600" : "text-slate-400"
                }`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="surface rounded-3xl shadow-soft border border-white/60 p-5 sm:p-7"
          >
            {step === 0 && (
              <StepClassification
                student={student}
                onChange={(u) => setStudent((s) => ({ ...s, ...u }))}
                onNext={handleClassificationNext}
                onBack={back}
              />
            )}
            {step === 1 && (
              <StepEntry
                student={student}
                onChange={setStudent}
                onNext={next}
              />
            )}
            {step === 2 && <StepReview student={student} onBack={back} onNext={next} />}
            {step === 3 && (
              <StepConcentration
                current={student.concentration}
                onChange={(c: Concentration) => setStudent((s) => ({ ...s, concentration: c }))}
                onBack={back}
                onNext={next}
              />
            )}
            {step === 4 && (
              <StepPlan
                student={student}
                onStudentChange={(u) => setStudent((s) => ({ ...s, ...u }))}
                onBack={back}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8 no-print">
        Built for AAMU students · Not an official advising document
      </p>
    </div>
  );
}
