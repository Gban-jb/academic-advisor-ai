"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AAMU, MAJORS, MINORS } from "@/lib/university";
import { COURSES } from "@/lib/data";

interface Props {
  onBack: () => void;
  onEnterPlanner: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function UniversityDetail({ onBack, onEnterPlanner }: Props) {
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Group the catalog by subject prefix (CS, MTH, ENG, …). CS shown first.
  const catalog = useMemo(() => {
    const groups: Record<string, { code: string; title: string; credits: number; prereqs: string[] }[]> = {};
    Object.values(COURSES).forEach((c) => {
      const prefix = c.code.split(" ")[0];
      (groups[prefix] ??= []).push({ code: c.code, title: c.title, credits: c.credits, prereqs: c.prereqs });
    });
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => parseInt(a.code.split(" ")[1]) - parseInt(b.code.split(" ")[1]))
    );
    return Object.entries(groups).sort(([a], [b]) => (a === "CS" ? -1 : b === "CS" ? 1 : a.localeCompare(b)));
  }, []);

  const Section = ({ children, i = 0 }: { children: React.ReactNode; i?: number }) => (
    <motion.section variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={i}>
      {children}
    </motion.section>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {/* Top bar */}
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-maroon-700 transition-colors mb-6 flex items-center gap-1">
        ← Back to welcome
      </button>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden shadow-lift mb-8 h-72 sm:h-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AAMU.hero} alt="AAMU campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/90 via-maroon-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AAMU.seal} alt="AAMU seal" className="h-16 w-16 rounded-full bg-white/90 p-1 shadow-lg shrink-0" />
          <div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-2xl sm:text-4xl font-bold text-white leading-tight">{AAMU.name}</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="text-gold-200 text-sm mt-1">{AAMU.location} · {AAMU.type}</motion.p>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {AAMU.stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="surface rounded-2xl p-4 border border-white/60 shadow-sm text-center">
              <div className="text-xl sm:text-2xl font-bold text-maroon-800">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── About + photos ── */}
      <Section i={1}>
        <div className="grid lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">About the University</h2>
            <p className="text-slate-600 leading-relaxed text-sm">{AAMU.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[`🎨 ${AAMU.colors}`, `🐶 ${AAMU.mascot}`, `📍 ${AAMU.location}`].map((t) => (
                <span key={t} className="text-xs bg-maroon-50 text-maroon-700 border border-maroon-100 rounded-full px-3 py-1">{t}</span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {AAMU.photos.map((p, i) => (
              <motion.figure key={p.url} whileHover={{ scale: 1.03 }}
                className={`relative rounded-2xl overflow-hidden shadow-sm ${i === 0 ? "col-span-2 h-36" : "h-28"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] px-2 py-1">{p.caption}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Majors ── */}
      <Section i={2}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Majors</h2>
        <p className="text-sm text-slate-500 mb-4">Computer Science has a full degree planner — the rest are listed below.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-10">
          {MAJORS.map((m, i) => (
            <motion.div key={m.name} variants={fadeUp} custom={i * 0.3} initial="hidden" whileInView="show" viewport={{ once: true }}
              className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                m.planner ? "border-maroon-300 bg-maroon-50/60 shadow-sm" : "border-slate-100 bg-white"
              }`}>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                <div className="text-xs text-slate-400 truncate">{m.college}</div>
              </div>
              {m.planner ? (
                <div className="shrink-0 flex items-center gap-1.5">
                  <a href="/internships"
                    className="text-xs font-medium text-maroon-700 border border-maroon-200 hover:bg-maroon-50 rounded-lg px-2.5 py-1.5 transition-colors">
                    Internships
                  </a>
                  <button onClick={onEnterPlanner}
                    className="text-xs font-semibold text-white bg-maroon-700 hover:bg-maroon-800 rounded-lg px-3 py-1.5 transition-colors">
                    Plan it →
                  </button>
                </div>
              ) : (
                <span className="shrink-0 text-[10px] text-slate-400 border border-slate-200 rounded-md px-2 py-1">Catalog</span>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Minors ── */}
      <Section i={3}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Minors</h2>
        <div className="flex flex-wrap gap-2 mb-10">
          {MINORS.map((m) => (
            <span key={m} className="text-sm bg-white border border-slate-200 text-slate-600 rounded-full px-3.5 py-1.5 shadow-sm hover:border-maroon-200 transition-colors">
              {m}
            </span>
          ))}
        </div>
      </Section>

      {/* ── Course catalog ── */}
      <Section i={4}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Catalog</h2>
          <button onClick={() => setCatalogOpen((o) => !o)} className="text-sm text-maroon-700 hover:text-maroon-900 font-medium">
            {catalogOpen ? "Hide" : `Show all ${Object.keys(COURSES).length} courses`}
          </button>
        </div>
        <motion.div
          initial={false}
          animate={{ height: catalogOpen ? "auto" : 0, opacity: catalogOpen ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-2">
            {catalog.map(([prefix, courses]) => (
              <div key={prefix}>
                <h3 className="text-xs font-bold text-maroon-700 uppercase tracking-wide mb-2 sticky top-0">{prefix} · {courses.length} courses</h3>
                <div className="space-y-1.5">
                  {courses.map((c) => (
                    <div key={c.code} className="flex items-baseline gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-400 w-16 shrink-0">{c.code}</span>
                      <span className="flex-1 min-w-0">
                        <span className="text-slate-700">{c.title}</span>
                        {c.prereqs.length > 0 && (
                          <span className="block text-[10px] text-slate-400">Prereq: {c.prereqs.join(", ")}</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{c.credits} cr</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ── CTA into the planner (the lab) ── */}
      <Section i={5}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-800 to-maroon-950 p-8 sm:p-10 mt-8 text-center shadow-lift">
          <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold-400/20 blur-2xl" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white relative">Ready to plan your degree?</h2>
          <p className="text-maroon-100 mt-2 max-w-xl mx-auto relative text-sm sm:text-base">
            Take your courses into the Lab — upload your transcript and we&rsquo;ll build your
            semester-by-semester path to graduation.
          </p>
          <motion.button onClick={onEnterPlanner} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="relative mt-6 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-maroon-950 rounded-2xl px-8 py-3.5 text-lg font-bold shadow-lg transition-colors">
            Dive into the Lab →
          </motion.button>
        </div>
      </Section>
    </div>
  );
}
