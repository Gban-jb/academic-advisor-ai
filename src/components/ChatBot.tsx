"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StudentData } from "@/lib/data";
import type { ScheduledSemester } from "@/lib/scheduler";

interface Message {
  role: "user" | "assistant";
  content: string;
  scheduleChanged?: boolean;
}

interface Props {
  student: StudentData;
  semesters: ScheduledSemester[];
  onScheduleChange: (semesters: ScheduledSemester[]) => void;
}

const SUGGESTIONS = [
  { icon: "🗓️", text: "What can I take next semester?" },
  { icon: "🔁", text: "Swap a course in semester 2" },
  { icon: "⏭️", text: "Move CS 381 to a later semester" },
  { icon: "✅", text: "Which courses are required?" },
];

/**
 * The model answers with light markdown — **bold**, `code`, "- " bullets.
 * Rendering those beats showing students the asterisks.
 */
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const bullet = /^\s*[-•]\s+/.test(line);
        const clean = bullet ? line.replace(/^\s*[-•]\s+/, "") : line;
        const parts = clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
        const rendered = parts.map((p, pi) => {
          if (p.startsWith("**") && p.endsWith("**"))
            return <strong key={pi} className="font-semibold">{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`"))
            return (
              <code key={pi} className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.85em]">
                {p.slice(1, -1)}
              </code>
            );
          return <span key={pi}>{p}</span>;
        });
        if (bullet)
          return (
            <span key={li} className="flex gap-1.5">
              <span className="shrink-0 opacity-50">•</span>
              <span>{rendered}</span>
            </span>
          );
        return (
          <span key={li} className="block min-h-[0.5em]">
            {rendered}
          </span>
        );
      })}
    </>
  );
}

function PawAvatar({ size = "h-7 w-7 text-xs" }: { size?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ring-2 ring-gold-300/70 ${size}`}
      style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #4a0711 100%)" }}
      aria-hidden
    >
      🐾
    </span>
  );
}

export default function ChatBot({ student, semesters, onScheduleChange }: Props) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError]       = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const userMsg = text.trim();
    if (!userMsg || thinking) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setThinking(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          student,
          semesters,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat request failed");

      const scheduleChanged = !!data.updatedSemesters;
      if (scheduleChanged) onScheduleChange(data.updatedSemesters);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, scheduleChanged },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  const firstName = student.name?.split(" ")[0] || "there";

  return (
    <>
      {/* Floating launcher */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {!open && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="pointer-events-none hidden rounded-full border border-maroon-100 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-maroon-800 shadow-md backdrop-blur sm:block"
            >
              Ask your advisor
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lift ring-2 ring-gold-300/60 ring-offset-2 ring-offset-transparent"
          style={{ background: "linear-gradient(135deg, #8f1024 0%, #5a0915 60%, #3d060e 100%)" }}
          aria-label={open ? "Close advisor chat" : "Open advisor chat"}
        >
          {/* Breathing glow while closed */}
          {!open && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 24px 4px rgba(123,13,30,0.45)" }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <AnimatePresence mode="wait">
            {open ? (
              <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.span key="paw" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }} className="text-xl" aria-hidden>
                🐾
              </motion.span>
            )}
          </AnimatePresence>
          {!open && messages.length === 0 && (
            <span className="absolute right-0.5 top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-gold-400" />
          )}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 left-4 right-4 z-50 flex h-[min(72vh,600px)] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-[0_24px_70px_-12px_rgba(61,6,14,0.45)] backdrop-blur-xl sm:left-auto sm:right-6 sm:w-[400px]"
          >
            {/* Header */}
            <div
              className="relative shrink-0 overflow-hidden px-4 py-4"
              style={{ background: "linear-gradient(120deg, #8f1024 0%, #5a0915 55%, #3d060e 100%)" }}
            >
              {/* Gold sheen */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full opacity-25 blur-2xl"
                style={{ background: "radial-gradient(circle, #f5c542 0%, transparent 70%)" }}
              />
              <div className="relative flex items-center gap-3">
                <PawAvatar size="h-10 w-10 text-lg" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-bold leading-none text-white">
                    Bulldog Advisor
                    <span className="rounded bg-gold-400/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold-300" style={{ color: "#f5c542" }}>
                      AI
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-maroon-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    Knows your whole plan · can edit it
                  </p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setError(""); }}
                    title="Start a new conversation"
                    className="ml-auto rounded-lg p-1.5 text-maroon-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
              {messages.length === 0 && !thinking && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pt-3 text-center">
                  <motion.div
                    animate={{ rotate: [0, -12, 12, 0] }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mb-3 inline-block text-4xl"
                    aria-hidden
                  >
                    👋
                  </motion.div>
                  <p className="mb-1 text-sm font-bold text-slate-800">Hey {firstName}!</p>
                  <p className="mx-auto mb-5 max-w-[260px] text-xs leading-relaxed text-slate-400">
                    I can see your full degree plan. Ask me to move courses, check
                    prerequisites, or explain what&apos;s left.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s.text}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        onClick={() => send(s.text)}
                        className="group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left text-xs text-slate-600 shadow-sm transition-all hover:-translate-y-px hover:border-maroon-300 hover:text-maroon-800 hover:shadow"
                      >
                        <span className="text-sm" aria-hidden>{s.icon}</span>
                        {s.text}
                        <span className="ml-auto text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-maroon-400" aria-hidden>→</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22 }}
                    className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && <PawAvatar />}
                    <div className={`max-w-[82%] ${msg.role === "user" ? "" : "flex flex-col gap-1"}`}>
                      {msg.scheduleChanged && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-1 flex items-center gap-1.5 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-green-800"
                        >
                          <span aria-hidden>✨</span>
                          Plan updated — scroll up to see it
                        </motion.div>
                      )}
                      <div
                        className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "rounded-2xl rounded-br-md text-white shadow-md"
                            : "rounded-2xl rounded-bl-md border border-slate-100 bg-white text-slate-800 shadow-sm"
                        }`}
                        style={
                          msg.role === "user"
                            ? { background: "linear-gradient(135deg, #8f1024 0%, #5a0915 100%)" }
                            : undefined
                        }
                      >
                        <RichText text={msg.content} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {thinking && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                  <PawAvatar />
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "#8f1024" }}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-slate-400">thinking…</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs text-red-600"
                >
                  {error}
                </motion.p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white/90 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-1 pl-4 pr-1 transition-all focus-within:border-maroon-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-maroon-100">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask about your plan, ${firstName}…`}
                  disabled={thinking}
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-opacity disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, #8f1024 0%, #5a0915 100%)" }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </motion.button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-slate-300">
                AI advisor — double-check anything that affects your graduation
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
