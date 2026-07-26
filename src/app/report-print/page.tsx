"use client";

import { useEffect, useState } from "react";
import type { AdvisorReport } from "@/lib/advisor-types";
import type { StudentData } from "@/lib/data";

interface StoredReport {
  report: AdvisorReport;
  student: StudentData;
}

const TYPE_LABEL: Record<string, string> = {
  core: "Core",
  concentration: "Conc.",
  math: "Math",
  gen_ed: "GenEd",
  elective: "Elective",
};

const CONC_LABELS: Record<string, string> = {
  CYB: "Cybersecurity",
  AI: "Artificial Intelligence",
  GCS: "General Computer Science",
};

export default function ReportPrintPage() {
  const [data, setData] = useState<StoredReport | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("advisor_report");
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (data) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading report…
      </div>
    );
  }

  const { report, student } = data;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: "Georgia", serif; font-size: 11pt; color: #1e293b; background: white; }
        @page { size: letter; margin: 1in; }
        @media print { .no-print { display: none !important; } }

        .page { page-break-after: always; padding-bottom: 24pt; }
        .page:last-child { page-break-after: avoid; }

        h1 { font-size: 20pt; font-weight: 700; color: #7c1530; }
        h2 { font-size: 13pt; font-weight: 700; color: #7c1530; margin-bottom: 6pt; border-bottom: 1.5pt solid #7c1530; padding-bottom: 3pt; }
        h3 { font-size: 11pt; font-weight: 700; color: #1e293b; margin-bottom: 4pt; }

        table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        th { background: #7c1530; color: white; padding: 5pt 8pt; text-align: left; font-size: 9pt; font-family: sans-serif; }
        td { padding: 4pt 8pt; border-bottom: 0.5pt solid #e2e8f0; vertical-align: top; font-family: sans-serif; font-size: 9.5pt; }
        tr:nth-child(even) td { background: #f8fafc; }

        .badge { display: inline-block; padding: 1pt 5pt; border-radius: 3pt; font-size: 8pt; font-weight: 600; font-family: sans-serif; }
        .badge-core { background: #fee2e2; color: #991b1b; }
        .badge-conc { background: #dbeafe; color: #1e40af; }
        .badge-math { background: #ede9fe; color: #5b21b6; }
        .badge-gen  { background: #f1f5f9; color: #475569; }
        .badge-elec { background: #dcfce7; color: #166534; }

        .stat-row { display: flex; gap: 16pt; margin-bottom: 12pt; }
        .stat-box { flex: 1; border: 0.5pt solid #e2e8f0; border-top: 2pt solid #7c1530; border-radius: 4pt; padding: 8pt; }
        .stat-value { font-size: 18pt; font-weight: 700; color: #7c1530; font-family: sans-serif; }
        .stat-label { font-size: 8pt; color: #64748b; margin-top: 2pt; font-family: sans-serif; }

        .insight-list { list-style: none; }
        .insight-list li { padding: 4pt 0; padding-left: 12pt; position: relative; border-bottom: 0.3pt solid #f1f5f9; font-size: 10pt; }
        .insight-list li::before { content: "→"; position: absolute; left: 0; color: #7c1530; font-weight: 700; }

        .progress-bar-container { height: 6pt; background: #e2e8f0; border-radius: 3pt; margin: 4pt 0; overflow: hidden; }
        .progress-bar { height: 6pt; background: linear-gradient(to right, #7c1530, #ebb52a); border-radius: 3pt; }

        .warning-box { border: 0.8pt solid; border-radius: 4pt; padding: 8pt; margin-bottom: 8pt; page-break-inside: avoid; }
        .warning-error { border-color: #fca5a5; background: #fff5f5; }
        .warning-warn  { border-color: #fcd34d; background: #fffbeb; }

        .semester-row { margin-bottom: 10pt; page-break-inside: avoid; }
        .sem-header { background: #f1f5f9; padding: 4pt 8pt; border-left: 3pt solid #7c1530; font-family: sans-serif; font-size: 10pt; font-weight: 700; display: flex; justify-content: space-between; }

        .footer { margin-top: 16pt; border-top: 0.5pt solid #e2e8f0; padding-top: 6pt; font-size: 8pt; color: #94a3b8; text-align: center; font-family: sans-serif; }
        .header-logo { font-size: 9pt; color: #7c1530; font-weight: 700; letter-spacing: 0.5pt; font-family: sans-serif; }
        .section-gap { margin-top: 16pt; }
      `}</style>

      {/* ═══════════════════ PAGE 1: SUMMARY ═══════════════════ */}
      <div className="page">
        {/* AAMU Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16pt", borderBottom: "2pt solid #7c1530", paddingBottom: "10pt" }}>
          <div>
            <div className="header-logo">ALABAMA A&amp;M UNIVERSITY</div>
            <h1 style={{ marginTop: "2pt" }}>Academic Advising Report</h1>
            <div style={{ fontFamily: "sans-serif", fontSize: "9pt", color: "#64748b", marginTop: "3pt" }}>
              Department of Electrical Engineering &amp; Computer Science · BS Computer Science · 2025-2026 Bulletin
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "sans-serif", fontSize: "9pt", color: "#64748b" }}>
            <div>Generated: {today}</div>
            <div style={{ fontWeight: 700, marginTop: "2pt", color: "#1e293b" }}>
              {student.name || "Student Name"}
            </div>
            {student.id && <div>ID: {student.id}</div>}
          </div>
        </div>

        {/* Stat row */}
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{report.studentSummary.creditsCompleted}</div>
            <div className="stat-label">Credits Completed</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{report.studentSummary.creditsRemaining}</div>
            <div className="stat-label">Credits Remaining</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{student.gpa.toFixed(2)}</div>
            <div className="stat-label">Cumulative GPA</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: "13pt" }}>{report.studentSummary.estimatedGraduation}</div>
            <div className="stat-label">Estimated Graduation</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ fontSize: "11pt", textTransform: "capitalize" }}>
              {report.studentSummary.academicStanding.replace("_", " ")}
            </div>
            <div className="stat-label">Academic Standing</div>
          </div>
        </div>

        {/* Standing note */}
        <div style={{ background: "#f8fafc", border: "0.5pt solid #e2e8f0", borderLeft: "3pt solid #7c1530", borderRadius: "4pt", padding: "8pt 10pt", marginBottom: "12pt", fontFamily: "sans-serif", fontSize: "10pt", color: "#334155" }}>
          {report.studentSummary.standingNote}
        </div>

        {/* Concentration info */}
        <h2>Concentration</h2>
        <div style={{ fontFamily: "sans-serif", marginBottom: "8pt" }}>
          <strong>Current:</strong> {CONC_LABELS[student.concentration] ?? student.concentration} &nbsp;|&nbsp;
          <strong>Recommended:</strong>{" "}
          <span style={{ color: "#7c1530" }}>
            {CONC_LABELS[report.concentrationAnalysis.recommended] ?? report.concentrationAnalysis.recommended}
          </span>
        </div>
        <p style={{ fontFamily: "sans-serif", fontSize: "10pt", color: "#475569", marginBottom: "10pt" }}>
          {report.concentrationAnalysis.recommendationReason}
        </p>

        {report.concentrationAnalysis.fits.map((fit) => (
          <div key={fit.code} style={{ marginBottom: "6pt" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: "10pt", fontWeight: 600 }}>
              <span>{fit.name} ({fit.code})</span>
              <span style={{ color: "#7c1530" }}>{fit.completionPercentage}% · {fit.completedCount}/{fit.totalRequired} courses</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${fit.completionPercentage}%` }} />
            </div>
            {fit.remainingCourses.length > 0 && (
              <div style={{ fontFamily: "sans-serif", fontSize: "9pt", color: "#64748b" }}>
                Remaining: {fit.remainingCourses.join(", ")}
              </div>
            )}
          </div>
        ))}

        {/* AI Insights */}
        <div className="section-gap">
          <h2>Personalized Insights</h2>
          <ul className="insight-list">
            {report.aiInsights.map((ins, i) => <li key={i}>{ins}</li>)}
          </ul>
        </div>

        {report.concerns.length > 0 && (
          <div className="section-gap">
            <h2>Items to Discuss with Your Advisor</h2>
            <ul className="insight-list">
              {report.concerns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        <div className="footer">
          This report was generated by AI and is not an official advising document. Always verify with your academic advisor. · Page 1
        </div>
      </div>

      {/* ═══════════════════ PAGE 2: NEXT SEMESTER + WARNINGS ═══════════════════ */}
      <div className="page">
        <h2 style={{ marginBottom: "10pt" }}>Recommended Next Semester Course Plan</h2>
        <div style={{ fontFamily: "sans-serif", fontSize: "10pt", color: "#64748b", marginBottom: "8pt" }}>
          Total recommended credits: <strong style={{ color: "#1e293b" }}>
            {report.nextSemesterPlan.reduce((s, c) => s + c.credits, 0)} hours
          </strong>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Code</th>
              <th style={{ width: "28%" }}>Course Name</th>
              <th style={{ width: "6%" }}>Cr</th>
              <th style={{ width: "12%" }}>Priority</th>
              <th>Why This Course Now</th>
            </tr>
          </thead>
          <tbody>
            {report.nextSemesterPlan.map((c) => (
              <tr key={c.code}>
                <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{c.code}</td>
                <td>{c.name}</td>
                <td style={{ textAlign: "center" }}>{c.credits}</td>
                <td>
                  <span className={`badge ${
                    c.priority === "required" ? "badge-core" :
                    c.priority === "concentration" ? "badge-conc" :
                    c.priority === "math" ? "badge-math" : "badge-elec"
                  }`}>{c.priority}</span>
                </td>
                <td style={{ color: "#475569" }}>{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Prerequisite Warnings */}
        <div className="section-gap">
          <h2>Prerequisite Warnings</h2>
          {report.prerequisiteWarnings.length === 0 ? (
            <p style={{ fontFamily: "sans-serif", fontSize: "10pt", color: "#22c55e" }}>
              ✓ No prerequisite violations detected.
            </p>
          ) : (
            report.prerequisiteWarnings.map((w, i) => (
              <div key={i} className={`warning-box ${w.severity === "error" ? "warning-error" : "warning-warn"}`}>
                <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: "10pt", marginBottom: "3pt" }}>
                  {w.severity === "error" ? "⛔ " : "⚠️ "}{w.course} — {w.courseName}
                </div>
                <div style={{ fontFamily: "sans-serif", fontSize: "10pt", marginBottom: "4pt" }}>{w.issue}</div>
                {w.missingPrereqs.length > 0 && (
                  <div style={{ fontFamily: "monospace", fontSize: "9pt", color: "#7c1530", marginBottom: "3pt" }}>
                    Missing: {w.missingPrereqs.join(", ")}
                  </div>
                )}
                <div style={{ fontFamily: "sans-serif", fontSize: "9.5pt", fontWeight: 600, color: "#374151" }}>
                  Recommendation: {w.recommendation}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="footer">
          This report was generated by AI and is not an official advising document. · Page 2
        </div>
      </div>

      {/* ═══════════════════ PAGE 3: FULL ROADMAP ═══════════════════ */}
      <div className="page">
        <h2 style={{ marginBottom: "10pt" }}>Complete Remaining Degree Roadmap</h2>
        <div style={{ fontFamily: "sans-serif", fontSize: "10pt", color: "#64748b", marginBottom: "12pt" }}>
          Concentration: {CONC_LABELS[student.concentration]} · Estimated graduation: {report.studentSummary.estimatedGraduation}
        </div>

        {report.fullRoadmap.map((sem) => (
          <div key={sem.semesterNumber} className="semester-row">
            <div className="sem-header">
              <span>Semester {sem.semesterNumber} — {sem.semesterLabel}</span>
              <span>{sem.totalCredits} credits</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Code</th>
                  <th>Course Name</th>
                  <th style={{ width: "8%" }}>Credits</th>
                  <th style={{ width: "10%" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c) => (
                  <tr key={c.code}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "9pt" }}>{c.code}</td>
                    <td>{c.name}</td>
                    <td style={{ textAlign: "center" }}>{c.credits}</td>
                    <td>
                      <span className={`badge ${
                        c.type === "core" ? "badge-core" :
                        c.type === "concentration" ? "badge-conc" :
                        c.type === "math" ? "badge-math" :
                        c.type === "gen_ed" ? "badge-gen" : "badge-elec"
                      }`}>{TYPE_LABEL[c.type] ?? c.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sem.notes && (
              <div style={{ fontFamily: "sans-serif", fontSize: "9pt", color: "#64748b", padding: "3pt 8pt", background: "#f8fafc" }}>
                Note: {sem.notes}
              </div>
            )}
          </div>
        ))}

        {/* Legend */}
        <div style={{ marginTop: "12pt", display: "flex", gap: "10pt", fontFamily: "sans-serif", fontSize: "9pt", flexWrap: "wrap" }}>
          {[
            ["badge-core", "Core Required"],
            ["badge-conc", "Concentration"],
            ["badge-math", "Math"],
            ["badge-gen", "General Education"],
            ["badge-elec", "Elective"],
          ].map(([cls, label]) => (
            <span key={cls}>
              <span className={`badge ${cls}`}>{label}</span>
            </span>
          ))}
        </div>

        <div className="footer">
          This report was generated by AI and is not an official advising document. Verify all plans with your assigned academic advisor. · Page 3
          <br />Generated {today} · Alabama A&M University, Department of Electrical Engineering &amp; Computer Science
        </div>
      </div>

      {/* Print button (hidden on print) */}
      <div className="no-print" style={{ position: "fixed", bottom: "20px", right: "20px", display: "flex", gap: "8px" }}>
        <button
          onClick={() => window.print()}
          style={{ background: "#7c1530", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "14px", cursor: "pointer" }}
        >
          Close
        </button>
      </div>
    </>
  );
}
