"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  COURSES, norm, gradeIsPassing, gradeIsRegistered,
  type StudentData, type Grade, type Concentration, type TranscriptEntry,
} from "@/lib/data";

const ALL_GRADES: Grade[] = ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F","W","WF","I","TA","TB","TC","S","CR","P","REG"];
const CONCENTRATIONS: { value: Concentration; label: string }[] = [
  { value: "AI",  label: "Artificial Intelligence" },
  { value: "CYB", label: "Cybersecurity" },
  { value: "GCS", label: "General Computer Science" },
];

interface Props {
  student: StudentData;
  onChange: (s: StudentData) => void;
  onNext: () => void;
}

export default function StepEntry({ student, onChange, onNext }: Props) {
  const [newCode, setNewCode]   = useState("");
  const [newGrade, setNewGrade] = useState<Grade>("A");
  const [newTerm, setNewTerm]   = useState("");
  const [error, setError]       = useState("");

  const fileRef                           = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]         = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // ── Manual add ──
  function addCourse() {
    const code = norm(newCode);
    if (!code) { setError("Enter a course code."); return; }
    const course = COURSES[code];
    if (!course) { setError(`Unknown course: ${code}. Check the code and try again.`); return; }
    if (student.transcript.find((e) => e.code === code)) { setError(`${code} is already in your transcript.`); return; }
    setError("");
    onChange({ ...student, transcript: [...student.transcript, { code, grade: newGrade, credits: course.credits, term: newTerm || undefined }] });
    setNewCode(""); setNewTerm("");
  }
  const removeCourse = (code: string) => onChange({ ...student, transcript: student.transcript.filter((e) => e.code !== code) });
  const updateGrade  = (code: string, grade: Grade) => onChange({ ...student, transcript: student.transcript.map((e) => e.code === code ? { ...e, grade } : e) });

  // ── Upload ──
  async function handleUpload(file: File) {
    setUploading(true); setUploadError(""); setUploadSuccess("");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/extract-transcript", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Extraction failed. Please try again."); return; }
      const extracted: TranscriptEntry[] = data.courses ?? [];
      if (extracted.length === 0) { setUploadError("No courses found. Try a clearer scan."); return; }
      const existing = new Set(student.transcript.map((e) => e.code));
      const fresh = extracted.filter((e) => !existing.has(e.code));
      const extractedGpa = typeof data.gpa === "number" ? data.gpa : null;
      onChange({
        ...student,
        transcript: [...student.transcript, ...fresh],
        ...(extractedGpa !== null ? { gpa: extractedGpa } : {}),
      });
      const gpaMsg = extractedGpa !== null ? ` · GPA set to ${extractedGpa.toFixed(2)}` : "";
      setUploadSuccess(`Extracted ${extracted.length} courses · ${fresh.length} new added${gpaMsg}. Review below.`);
    } catch (err) {
      setUploadError(`Network error: ${err}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  // ── Totals ──
  const passing = student.transcript.filter((e) => gradeIsPassing(e.grade));
  const failing = student.transcript.filter((e) => !gradeIsPassing(e.grade) && !gradeIsRegistered(e.grade));
  const reg     = student.transcript.filter((e) => gradeIsRegistered(e.grade));
  const totalCredits = [...passing, ...reg].reduce((s, e) => s + e.credits, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Your Course History</h2>
          <p className="text-slate-500 text-sm mt-1">
            {student.classification === "frosh1"
              ? "We've pre-filled your recommended first-semester courses. Edit or remove any that don't apply."
              : "Upload a transcript or add courses manually. Grade C or above counts toward your degree."}
          </p>
        </div>
      </div>

      {/* Freshman 1st-sem notice */}
      {student.classification === "frosh1" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl bg-maroon-50 border border-maroon-200 px-4 py-3 flex gap-3"
        >
          <span className="text-lg">🌱</span>
          <div>
            <p className="text-sm font-semibold text-maroon-800">Welcome, freshman!</p>
            <p className="text-xs text-maroon-600 mt-0.5">
              Your standard first-semester courses are pre-loaded below. Remove any you&apos;re not
              taking and add extras if your advisor placed you differently.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Dropzone ── */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        animate={{
          borderColor: dragOver ? "#bd315d" : "#f6d0d9",
          backgroundColor: dragOver ? "rgba(189,49,93,0.06)" : "rgba(252,243,245,0.5)",
        }}
        className="cursor-pointer border-2 border-dashed rounded-2xl p-6 mb-6 text-center transition-shadow hover:shadow-soft"
      >
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 py-1">
              <svg className="animate-spin h-7 w-7 text-maroon-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-sm font-medium text-maroon-700">Reading your transcript…</p>
              <p className="text-xs text-slate-400">AI is extracting your courses</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1.5 py-1">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-maroon-600 to-maroon-800 flex items-center justify-center shadow-soft mb-1">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">Drop your transcript here, or <span className="text-maroon-700">browse</span></p>
              <p className="text-xs text-slate-400">PDF, PNG, or JPG · max 20 MB · AI extracts your courses automatically</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {uploadError && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{uploadError}</motion.p>
        )}
        {uploadSuccess && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-green-700 text-sm mb-4 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{uploadSuccess}</motion.p>
        )}
      </AnimatePresence>

      {/* Student info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Name",  el: <input className="field" value={student.name} onChange={(e) => onChange({ ...student, name: e.target.value })} /> },
          { label: "Student ID", el: <input className="field" value={student.id} onChange={(e) => onChange({ ...student, id: e.target.value })} /> },
          { label: "GPA", el: <input type="number" step="0.01" min="0" max="4" className="field" value={student.gpa} onChange={(e) => onChange({ ...student, gpa: parseFloat(e.target.value) || 0 })} /> },
          { label: "Concentration", el: (
            <select className="field" value={student.concentration} onChange={(e) => onChange({ ...student, concentration: e.target.value as Concentration })}>
              {CONCENTRATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )},
        ].map(({ label, el }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
            {el}
          </div>
        ))}
      </div>

      {/* Manual add */}
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Or add manually</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input className="field flex-1 min-w-[120px]" placeholder="Course code (e.g. CS 215)"
          value={newCode} onChange={(e) => setNewCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCourse()} />
        <select className="field !w-auto" value={newGrade} onChange={(e) => setNewGrade(e.target.value as Grade)}>
          {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input className="field !w-36" placeholder="Term (optional)" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={addCourse}
          className="bg-maroon-700 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-maroon-800 transition-colors shadow-sm">
          Add
        </motion.button>
      </div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-500">
        <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5"/>Counts toward degree</span>
        <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5"/>Excluded — must retake</span>
        <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-maroon-400 mr-1.5"/>Pre-registered</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr className="text-left text-slate-500">
              {["Code","Title","Cr","Grade","Counts?","Term",""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {student.transcript.map((entry) => {
                const course = COURSES[entry.code];
                const isPassing = gradeIsPassing(entry.grade);
                const isReg = gradeIsRegistered(entry.grade);
                return (
                  <motion.tr key={entry.code}
                    initial={{ opacity: 0, backgroundColor: "rgba(189,49,93,0.06)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{entry.code}</td>
                    <td className="px-4 py-2 text-slate-600">{course?.title ?? <span className="text-gold-600">Unknown course</span>}</td>
                    <td className="px-4 py-2 text-slate-500">{entry.credits}</td>
                    <td className="px-4 py-2">
                      <select value={entry.grade} onChange={(e) => updateGrade(entry.code, e.target.value as Grade)}
                        className={`text-xs font-semibold rounded-md px-2 py-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-maroon-400 ${
                          isReg ? "bg-maroon-100 text-maroon-700" : isPassing ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {isReg ? <span className="text-maroon-600">Registered</span>
                        : isPassing ? <span className="text-green-600 font-medium">✓ {entry.credits} cr</span>
                        : <span className="text-red-500 font-medium">✗ Retake</span>}
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{entry.term ?? "—"}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => removeCourse(entry.code)} className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {student.transcript.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Upload your transcript above or add courses manually.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-slate-500 flex gap-4">
          <span><span className="font-semibold text-slate-900">{totalCredits}</span> / 125 credits</span>
          {failing.length > 0 && <span className="text-red-500"><span className="font-semibold">{failing.length}</span> to retake</span>}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onNext}
          className="bg-gradient-to-r from-maroon-700 to-maroon-800 text-white rounded-xl px-6 py-2.5 font-medium shadow-soft hover:shadow-lift transition-shadow">
          Review →
        </motion.button>
      </div>

      <style jsx>{`
        :global(.field) {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.field:focus) {
          outline: none;
          border-color: #bd315d;
          box-shadow: 0 0 0 3px rgba(189,49,93,0.12);
        }
      `}</style>
    </div>
  );
}
