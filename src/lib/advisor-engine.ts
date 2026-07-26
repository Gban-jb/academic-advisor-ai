/**
 * Deterministic advisor computations — no AI, no async.
 * All facts about the student's situation are computed here
 * and injected into the AI prompt so the model focuses on
 * reasoning rather than arithmetic.
 */

import {
  COURSES,
  CS_MAJOR_REQUIRED,
  CONCENTRATION_COURSES,
  CORE_CMP,
  GENED_FIXED,
  gradeIsPassing,
  gradeIsRegistered,
  type StudentData,
  type Concentration,
} from "./data";
import { prereqsMet, getDoneSet, getRegisteredSet, getFailedSet, buildSchedule } from "./scheduler";
import type { ComputedFacts, ConcentrationProgress, PrereqWarning } from "./advisor-types";

const CONC_NAMES: Record<Concentration, string> = {
  CYB: "Cybersecurity",
  AI: "Artificial Intelligence",
  GCS: "General Computer Science",
};

const ALL_CONCENTRATIONS: Concentration[] = ["CYB", "AI", "GCS"];

function getCreditsCompleted(transcript: StudentData["transcript"]): number {
  return transcript
    .filter((e) => gradeIsPassing(e.grade) || gradeIsRegistered(e.grade))
    .reduce((sum, e) => sum + e.credits, 0);
}

function computeConcentrationProgress(
  completedSet: Set<string>,
  gpa: number
): ConcentrationProgress[] {
  return ALL_CONCENTRATIONS.map((code) => {
    const required = CONCENTRATION_COURSES[code];
    const completed = required.filter((c) => completedSet.has(c));
    const remaining = required.filter((c) => !completedSet.has(c));
    return {
      code,
      name: CONC_NAMES[code],
      required,
      completed,
      remaining,
      pct: Math.round((completed.length / required.length) * 100),
    };
  });
}

function computePrereqWarnings(
  transcript: StudentData["transcript"],
  completedSet: Set<string>,
  registeredSet: Set<string>
): PrereqWarning[] {
  const warnings: PrereqWarning[] = [];

  // Check registered courses: are their prereqs actually met?
  for (const code of Array.from(registeredSet)) {
    const course = COURSES[code];
    if (!course) continue;
    // Use only completed (not registered) for prereq checking
    const missing = course.prereqs.filter((p) => !completedSet.has(p));
    if (missing.length > 0) {
      warnings.push({
        course: code,
        courseName: course.title,
        missing,
        severity: "error",
      });
    }
  }

  // Check if student has any failed courses that are prereqs for things they're registered for
  const failedSet = getFailedSet(transcript);
  for (const code of Array.from(registeredSet)) {
    const course = COURSES[code];
    if (!course) continue;
    const failedPrereqs = course.prereqs.filter((p) => failedSet.has(p) && !completedSet.has(p));
    if (failedPrereqs.length > 0) {
      const existing = warnings.find((w) => w.course === code);
      if (!existing) {
        warnings.push({
          course: code,
          courseName: course.title,
          missing: failedPrereqs,
          severity: "warning",
        });
      }
    }
  }

  return warnings;
}

function computeEligibleNextCourses(
  completedSet: Set<string>,
  registeredSet: Set<string>
): string[] {
  const have = new Set([...Array.from(completedSet), ...Array.from(registeredSet)]);
  const allCS = Object.keys(COURSES).filter((c) => c.startsWith("CS"));
  return allCS.filter((code) => {
    if (have.has(code)) return false;
    return prereqsMet(code, have);
  });
}

export function computeAdvisorFacts(student: StudentData): ComputedFacts {
  const completedSet = getDoneSet(student.transcript);
  const registeredSet = getRegisteredSet(student.transcript);
  const failedSet = getFailedSet(student.transcript);

  const creditsCompleted = getCreditsCompleted(student.transcript);
  const prereqWarnings = computePrereqWarnings(student.transcript, completedSet, registeredSet);
  const concentrationProgress = computeConcentrationProgress(completedSet, student.gpa);
  const eligibleNextCourses = computeEligibleNextCourses(completedSet, registeredSet);
  const remainingCore = CS_MAJOR_REQUIRED.filter(
    (c) => !completedSet.has(c) && !registeredSet.has(c)
  );

  const scheduleResult = buildSchedule(student);

  return {
    completedCodes: Array.from(completedSet),
    registeredCodes: Array.from(registeredSet),
    failedCodes: Array.from(failedSet),
    creditsCompleted,
    prereqWarnings,
    concentrationProgress,
    eligibleNextCourses,
    remainingCore,
    scheduleResult,
  };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildAdvisorSystemPrompt(student: StudentData, facts: ComputedFacts, ragContext = ""): string {
  const { completedCodes, registeredCodes, failedCodes, creditsCompleted,
    prereqWarnings, concentrationProgress, eligibleNextCourses, remainingCore, scheduleResult } = facts;

  const passingWithTitles = completedCodes
    .map((c) => `${c} (${COURSES[c]?.title ?? c})`)
    .join(", ");

  const registeredWithTitles = registeredCodes
    .map((c) => `${c} (${COURSES[c]?.title ?? c})`)
    .join(", ");

  const failedWithTitles = failedCodes
    .map((c) => `${c} (${COURSES[c]?.title ?? c})`)
    .join(", ");

  const concSummary = concentrationProgress
    .map(
      (cp) =>
        `  ${cp.code} (${cp.name}): ${cp.pct}% done (${cp.completed.length}/${cp.required.length} courses). ` +
        `Remaining: ${cp.remaining.join(", ") || "none"}`
    )
    .join("\n");

  const eligibleList = eligibleNextCourses
    .map((c) => `${c} (${COURSES[c]?.title ?? c}, ${COURSES[c]?.credits ?? 3} cr)`)
    .join(", ");

  const warningsList = prereqWarnings.length
    ? prereqWarnings
        .map(
          (w) =>
            `  [${w.severity.toUpperCase()}] ${w.course}: missing ${w.missing.join(", ")} — student is registered without meeting prereqs`
        )
        .join("\n")
    : "  None detected.";

  const scheduleSummary = scheduleResult.semesters
    .slice(0, 4)
    .map(
      (s, i) =>
        `  Semester ${i + 1} (${s.label}): ${s.courses.join(", ")} — ${s.totalCredits} credits`
    )
    .join("\n");

  return `You are an expert academic advisor at Alabama A&M University (AAMU) for the BS Computer Science program (2025-2026 Bulletin).
Your job is to generate a precise, personalized, and actionable academic advising report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:              ${student.name || "Student"}
Student ID:        ${student.id || "N/A"}
GPA:               ${student.gpa.toFixed(2)}
Selected Concentration: ${student.concentration} (${CONC_NAMES[student.concentration]})
Credits Completed: ${creditsCompleted} / 125 required

COMPLETED (passing): ${passingWithTitles || "None"}
CURRENTLY REGISTERED: ${registeredWithTitles || "None"}
FAILED / NEED RETAKE: ${failedWithTitles || "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-COMPUTED ANALYSIS (use these exact numbers — do not recalculate)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREREQUISITE WARNINGS (already enrolled without completing prereqs):
${warningsList}

CONCENTRATION PROGRESS:
${concSummary}

REMAINING CORE CS REQUIREMENTS (must complete to graduate):
${remainingCore.map((c) => `${c} (${COURSES[c]?.title ?? c})`).join(", ") || "All core courses completed!"}

COURSES ELIGIBLE TO TAKE NEXT (all prerequisites met):
${eligibleList || "No new courses available — check for prerequisite issues."}

ALGORITHM-GENERATED SCHEDULE (first 4 semesters):
${scheduleSummary}
Estimated graduation: ${scheduleResult.graduationSemester}

${ragContext ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nKNOWLEDGE BASE CONTEXT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${ragContext}\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEGREE REQUIREMENTS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total credits required: 125
Core CS required: CS 102, CS 104, CS 109, CS 203, CS 206, CS 209, CS 215, CS 314, CS 401, CS 403, CS 405, CS 410, CS 425
Required Math: MTH 125, MTH 126, MTH 237, MTH 453
Concentrations are 21 credit hours each. Min GPA 2.0, min grade C in all CS courses.

CYB (Cybersecurity): CS 381, CS 384, CS 488, CS 321, CS 386, CS 414, CS 421
AI (Artificial Intelligence): CS 381, CS 384, CS 488, CS 389, CS 409, CS 430, CS 450
GCS (General CS): CS 381, CS 384, CS 488 + 4 electives (2 at 300-level, 2 at 400-level)

KEY PREREQUISITE CHAINS:
• CS 102 → CS 109 → CS 215 → most 300/400-level CS courses
• CS 102 → CS 203 → CS 209 → CS 381 (Computer Organization)
• CS 209 + CS 215 → CS 384 (Operating Systems) [prereq for CYB courses: 414, 421]
• CS 102 → CS 206 → CS 314 → CS 401, CS 425
• CS 215 + MTH 126 → CS 425 (Theory of Algorithms)
• CS 215 + MTH 237 + MTH 453 → CS 430 (Machine Learning)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES FOR YOUR RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. nextSemesterPlan must ONLY include courses whose prerequisites are fully met (use the getEligibleNextCourses tool — include its genEdEligible list, not just CS courses).
2. nextSemesterPlan MUST be a BALANCED mix: 2-3 CS/Math courses + 1-2 General Education courses. Never recommend a semester of only CS courses.
3. Total credits in nextSemesterPlan must be between 12 and 18.
4. Use the pre-computed numbers exactly — do not invent completion percentages.
5. Prerequisite warnings must exactly match the detected warnings above (do not add imaginary ones).
6. fullRoadmap must use courses in prerequisite order — never schedule a course before its prereqs are in a prior semester. Each semester in fullRoadmap should also mix CS and gen-ed courses.
7. aiInsights must be specific to THIS student's actual courses and grades — never generic.
8. estimatedGraduation must align with the algorithm-generated schedule above.`;
}
