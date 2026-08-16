"use client";

import { useEffect, useRef, useState } from "react";

export interface PlanSummary {
  id: string;
  name: string;
  step?: number;
  updatedAt?: string;
}

interface Props {
  plans: PlanSummary[];
  currentId: string | null;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  busy?: boolean;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function PlanSwitcher({
  plans,
  currentId,
  onSwitch,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
  busy,
}: Props) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);

  const current = plans.find((p) => p.id === currentId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) {
        setOpen(false);
        setRenaming(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (name && name !== current?.name) onRename(name);
    setRenaming(false);
    setOpen(false);
  }

  return (
    <div ref={wrapper} className="relative no-print">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-maroon-200 hover:text-maroon-700 disabled:opacity-50"
      >
        <span className="truncate">{current?.name ?? "Plans"}</span>
        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lift">
          <div className="max-h-64 overflow-y-auto py-1">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSwitch(p.id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                  p.id === currentId ? "bg-slate-50" : ""
                }`}
              >
                <span className="mt-0.5 w-3 shrink-0 text-maroon-700">
                  {p.id === currentId ? "•" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-700">{p.name}</span>
                  {p.updatedAt && (
                    <span className="block text-xs text-slate-400">
                      edited {relativeTime(p.updatedAt)}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 p-2">
            {renaming ? (
              <form onSubmit={submitRename} className="flex gap-1.5 px-1 py-1">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-maroon-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-maroon-700 px-2.5 py-1.5 text-xs font-medium text-white"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                <button onClick={onCreate} className="rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50">
                  + New plan
                </button>
                <button onClick={onDuplicate} className="rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50">
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    setDraft(current?.name ?? "");
                    setRenaming(true);
                  }}
                  className="rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  disabled={plans.length <= 1}
                  className="rounded-lg px-2.5 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                  title={plans.length <= 1 ? "You need at least one plan" : undefined}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
