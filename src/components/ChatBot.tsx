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
  "What can I take next semester?",
  "Move CS 381 to a later semester",
  "Swap a course in semester 2",
  "Which courses are required?",
];

export default function ChatBot({ student, semesters, onScheduleChange }: Props) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError]       = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
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

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-maroon-700 to-maroon-900 shadow-lift flex items-center justify-center text-white"
        aria-label="Open advisor chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </motion.svg>
          )}
        </AnimatePresence>
        {/* Pulse indicator when closed */}
        {!open && messages.length === 0 && (
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-gold-400 border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden border border-slate-100"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-900 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Bulldog Advisor</p>
                <p className="text-[11px] text-maroon-200 mt-0.5">Ask me to adjust your schedule</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-[11px] text-maroon-200">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
              {messages.length === 0 && !thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-4">
                  <div className="text-3xl mb-2">👋</div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Hi {student.name?.split(" ")[0] || "there"}!</p>
                  <p className="text-xs text-slate-400 mb-5">I know your full degree plan. Ask me anything — I can move courses, check prerequisites, or suggest changes.</p>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex flex-col gap-1"}`}>
                      {msg.scheduleChanged && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 mb-1"
                        >
                          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Schedule updated — see changes in the plan above
                        </motion.div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-maroon-700 text-white rounded-tr-sm"
                            : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking dots */}
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-maroon-400"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center"
                >
                  {error}
                </motion.p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white shrink-0"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to change your schedule…"
                disabled={thinking}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-maroon-400 focus:ring-2 focus:ring-maroon-100 disabled:opacity-50 transition-colors placeholder:text-slate-400"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || thinking}
                whileTap={{ scale: 0.93 }}
                className="h-10 w-10 rounded-xl bg-maroon-700 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-maroon-800 transition-colors shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
