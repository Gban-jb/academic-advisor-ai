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

export default function Welcome({ onStart }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
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
        className="relative z-10 max-w-3xl text-center"
      >
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-maroon-200 bg-white/70 backdrop-blur px-4 py-1.5 mb-8 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-maroon-800">Your personal academic advisor</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item} className="text-4xl sm:text-6xl font-bold tracking-tight text-maroon-900 leading-[1.05]">
          Welcome to the{" "}
          <span className="bg-gradient-to-r from-maroon-700 via-maroon-600 to-gold-500 bg-clip-text text-transparent">
            Advising Place
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p variants={item} className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          You don&rsquo;t have to worry about which courses to take next. Tell us where
          you are, and your advisor maps out every semester — prerequisites, credits,
          and graduation — all the way to the finish line.
        </motion.p>

        {/* About us */}
        <motion.div variants={item} className="mt-8 grid sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
          {[
            { icon: "🎓", title: "Built for students", text: "Upload a transcript and see exactly what's left." },
            { icon: "🧭", title: "Smart sequencing", text: "Every prerequisite checked, every semester balanced." },
            { icon: "✨", title: "Stress-free", text: "No guesswork — a clear path to your degree." },
          ].map((c) => (
            <div key={c.title} className="surface rounded-2xl p-4 border border-white/60 shadow-sm">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="font-semibold text-slate-800 text-sm">{c.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.text}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={item} className="mt-10">
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-maroon-700 to-maroon-900 text-white rounded-2xl px-8 py-4 text-lg font-semibold shadow-lift"
          >
            Let&rsquo;s dive in
            <motion.span
              aria-hidden
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.button>
          <p className="text-xs text-slate-400 mt-4">Free for AAMU students · Takes about 2 minutes</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
