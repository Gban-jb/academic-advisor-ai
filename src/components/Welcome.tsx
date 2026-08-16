"use client";

import { motion } from "framer-motion";

interface Props {
  onStart: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const PILLARS = [
  {
    icon: "🎓",
    title: "Graduation Planning",
    text: "Tell us where you are and your advisor maps every remaining semester — prerequisites checked, credits balanced, all the way to the finish line.",
    points: ["Upload a transcript, see what's left", "Prereq-aware semester builder", "Save and compare plans"],
    cta: "Plan my graduation",
    external: false,
  },
  {
    icon: "💼",
    title: "Career Perspectives",
    text: "The degree is half the story. Live internship openings, hackathons, paid research summers and fellowships — curated for Bulldogs in every major.",
    points: ["1,000+ live internship openings", "Research programs & fellowships", "Programs built for HBCU students"],
    cta: "Explore careers",
    external: true,
  },
] as const;

export default function Welcome({ onStart }: Props) {
  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated ambient blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-maroon-300/30 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-gold-300/30 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-4xl text-center"
      >
        {/* Badge */}
        <motion.div variants={item} className="mb-7 inline-flex items-center gap-2 rounded-full border border-maroon-200 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs font-medium text-maroon-800">Your personal academic advisor · AAMU</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item} className="text-4xl font-bold leading-[1.05] tracking-tight text-maroon-900 sm:text-6xl">
          Welcome to the{" "}
          <span className="bg-gradient-to-r from-maroon-700 via-maroon-600 to-gold-500 bg-clip-text text-transparent">
            Advising Place
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p variants={item} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Two things every Bulldog needs a plan for: finishing the degree, and what
          comes after it. Start with either.
        </motion.p>

        {/* The two pillars */}
        <motion.div variants={item} className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
          {PILLARS.map((p) => {
            const inner = (
              <>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 text-xl shadow-soft">
                  <span aria-hidden>{p.icon}</span>
                </div>
                <h2 className="text-lg font-bold text-maroon-900">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{p.text}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-0.5 text-gold-500" style={{ color: "#b8860b" }} aria-hidden>✦</span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700 transition-colors group-hover:text-maroon-900">
                  {p.cta}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
                </span>
              </>
            );
            const cardCls =
              "group flex flex-col rounded-3xl border border-white/70 bg-white/80 p-6 text-left shadow-lift backdrop-blur transition-all hover:-translate-y-1 hover:border-maroon-200 hover:shadow-xl";
            return p.external ? (
              <a key={p.title} href="/careers" className={cardCls}>
                {inner}
              </a>
            ) : (
              <button key={p.title} onClick={onStart} className={cardCls}>
                {inner}
              </button>
            );
          })}
        </motion.div>

        <motion.p variants={item} className="mt-6 text-xs text-slate-400">
          Free for AAMU students · All 20 majors · No account needed to browse
        </motion.p>
      </motion.div>
    </div>
  );
}
