"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CAREER_SECTIONS,
  FIELD_LABELS,
  type CareerLink,
  type Field,
} from "@/lib/careers";

const FIELDS = Object.keys(FIELD_LABELS) as Field[];

function matches(link: CareerLink, field: Field | ""): boolean {
  if (!field) return true;
  return link.fields === "all" || link.fields.includes(field);
}

function CareersHub() {
  const params = useSearchParams();
  const initial = params.get("field");
  const [field, setField] = useState<Field | "">(
    initial && (FIELDS as string[]).includes(initial) ? (initial as Field) : ""
  );
  const [liveCount, setLiveCount] = useState<number | null>(null);

  // The internships card deserves a live number — it's our own board.
  useEffect(() => {
    let active = true;
    fetch("/api/internships?page=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d && setLiveCount(d.total))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(
    () =>
      CAREER_SECTIONS.map((s) => ({
        ...s,
        links: s.links.filter((l) => matches(l, field)),
      })).filter((s) => s.links.length > 0),
    [field]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-600" style={{ color: "#b8860b" }}>
          Career perspectives
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-maroon-900 sm:text-4xl">
          What comes after the degree
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          Internships, hackathons, research summers, fellowships and the people who can
          help — curated for AAMU students, with the programs built for HBCU Bulldogs
          marked <span className="mx-0.5 inline-flex items-center rounded bg-maroon-50 px-1.5 py-0.5 text-[10px] font-semibold text-maroon-800">🐾 for Bulldogs</span>.
          Pick your field and everything narrows to what applies to you.
        </p>
      </header>

      {/* Field filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FieldChip active={field === ""} onClick={() => setField("")}>
          All majors
        </FieldChip>
        {FIELDS.map((f) => (
          <FieldChip key={f} active={field === f} onClick={() => setField(f)}>
            {FIELD_LABELS[f]}
          </FieldChip>
        ))}
      </div>

      {/* Section jump links */}
      <div className="mb-10 flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-100 pb-4 text-xs text-slate-400">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="transition-colors hover:text-maroon-700">
            {s.icon} {s.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-14">
        {sections.map((section, si) => (
          <motion.section
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(si, 2) * 0.05 }}
            className="scroll-mt-20"
          >
            <div className="mb-4 flex items-baseline gap-2.5">
              <span className="text-xl" aria-hidden>{section.icon}</span>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{section.title}</h2>
              <span className="hidden text-xs text-slate-400 sm:inline">{section.tagline}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.links.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target={link.internal ? undefined : "_blank"}
                  rel={link.internal ? undefined : "noopener noreferrer"}
                  className={`group flex flex-col rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    link.internal
                      ? "border-maroon-200 bg-gradient-to-br from-maroon-50/80 to-white"
                      : "border-slate-100 bg-white hover:border-maroon-200"
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-maroon-800">
                      {link.name}
                    </span>
                    <span className="mt-0.5 shrink-0 text-xs text-slate-300 transition-colors group-hover:text-maroon-500" aria-hidden>
                      {link.internal ? "→" : "↗"}
                    </span>
                  </div>
                  <p className="flex-1 text-xs leading-relaxed text-slate-500">{link.blurb}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {link.internal && liveCount !== null && (
                      <span className="rounded bg-maroon-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {liveCount.toLocaleString()} live openings
                      </span>
                    )}
                    {link.hbcu && (
                      <span className="rounded bg-maroon-50 px-1.5 py-0.5 text-[10px] font-semibold text-maroon-800">
                        🐾 for Bulldogs
                      </span>
                    )}
                    {link.fields === "all" ? (
                      <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                        All majors
                      </span>
                    ) : (
                      link.fields.map((f) => (
                        <span key={f} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {FIELD_LABELS[f]}
                        </span>
                      ))
                    )}
                  </div>
                </a>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <p className="mt-14 border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-slate-400">
        External links open the organization&apos;s own site — check each program&apos;s
        current deadlines there. Know a program Bulldogs should see here? Tell your
        advisor and we&apos;ll add it.
      </p>
    </div>
  );
}

function FieldChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
        active
          ? "border-maroon-300 bg-maroon-50 text-maroon-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-maroon-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function CareersPage() {
  return (
    <Suspense>
      <CareersHub />
    </Suspense>
  );
}
