import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { generateText, tool, isStepCount } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  COURSES, CS_MAJOR_REQUIRED, CONCENTRATION_COURSES, CORE_CMP,
  type StudentData, type Concentration,
} from "@/lib/data";
import { prereqsMet, getDoneSet, getRegisteredSet, type ScheduledSemester } from "@/lib/scheduler";
import {
  mutMoveCourse, mutSwapCourse, mutAddCourse, mutRemoveCourse,
} from "@/lib/schedule-mutations";

const CONC_NAMES: Record<Concentration, string> = {
  CYB: "Cybersecurity",
  AI:  "Artificial Intelligence",
  GCS: "General Computer Science",
};

function buildSystemPrompt(student: StudentData, semesters: ScheduledSemester[]): string {
  const done       = getDoneSet(student.transcript);
  const registered = getRegisteredSet(student.transcript);

  const completedList  = Array.from(done).join(", ") || "none";
  const registeredList = Array.from(registered).join(", ") || "none";

  const planText = semesters
    .map((s, i) => `  Sem ${i + 1}  ${s.label}  (${s.totalCredits} cr): ${s.courses.join(", ")}`)
    .join("\n");

  const semLabels = semesters.map((s) => `"${s.label}"`).join(", ");

  return `You are Bulldog, a friendly and knowledgeable AI academic advisor for Alabama A&M University's CS program.
You help students adjust their degree plan by moving, swapping, adding, or removing courses.

## Student Profile
- Name: ${student.name || "Student"}
- GPA: ${student.gpa.toFixed(2)}
- Concentration: ${CONC_NAMES[student.concentration]}
- Credits completed: ${student.transcript.filter(e => done.has(e.code)).reduce((s, e) => s + e.credits, 0)}
- Courses completed: ${completedList}
- Currently registered: ${registeredList}

## Current Degree Plan
${planText}

## Tool Usage Rules
- Valid semester labels (use exactly as shown): ${semLabels}
- Always use the EXACT semester label strings above when calling tools
- Call checkPrerequisites or getEligibleCourses first when unsure
- After making a change, confirm what you did and the new credit count
- If a change fails, explain why and suggest an alternative
- Keep each semester between 12–18 credits
- Never drop required CS core courses without warning the student
- Be concise, specific, and encouraging`;
}

function makeTools(
  getSemesters: () => ScheduledSemester[],
  setSemesters: (s: ScheduledSemester[]) => void,
  student: StudentData
) {
  const initialDone = new Set([
    ...Array.from(getDoneSet(student.transcript)),
    ...Array.from(getRegisteredSet(student.transcript)),
  ]);

  return {
    getSchedule: tool({
      description: "Get the current semester-by-semester degree plan",
      inputSchema: z.object({}),
      execute: async () =>
        getSemesters().map((s, i) => ({
          index: i + 1,
          label: s.label,
          courses: s.courses,
          totalCredits: s.totalCredits,
        })),
    }),

    moveCourse: tool({
      description: "Move a course from one semester to another. Validates prerequisites and credit limits.",
      inputSchema: z.object({
        courseCode:   z.string().describe("Course code to move, e.g. CS 381"),
        fromSemLabel: z.string().describe("Exact label of the semester to move FROM"),
        toSemLabel:   z.string().describe("Exact label of the semester to move TO"),
      }),
      execute: async ({ courseCode, fromSemLabel, toSemLabel }) => {
        const result = mutMoveCourse(getSemesters(), courseCode, fromSemLabel, toSemLabel, initialDone);
        if (result.success) setSemesters(result.semesters);
        return result;
      },
    }),

    swapCourse: tool({
      description: "Replace a course in a semester with a different course.",
      inputSchema: z.object({
        semLabel:    z.string().describe("Exact semester label"),
        removeCode:  z.string().describe("Course to remove"),
        addCode:     z.string().describe("Course to add in its place"),
      }),
      execute: async ({ semLabel, removeCode, addCode }) => {
        const result = mutSwapCourse(getSemesters(), semLabel, removeCode, addCode, initialDone);
        if (result.success) setSemesters(result.semesters);
        return result;
      },
    }),

    addCourse: tool({
      description: "Add a new course to a specific semester.",
      inputSchema: z.object({
        semLabel:   z.string().describe("Exact semester label"),
        courseCode: z.string().describe("Course code to add"),
      }),
      execute: async ({ semLabel, courseCode }) => {
        const result = mutAddCourse(getSemesters(), semLabel, courseCode, initialDone);
        if (result.success) setSemesters(result.semesters);
        return result;
      },
    }),

    removeCourse: tool({
      description: "Remove a course from a semester.",
      inputSchema: z.object({
        semLabel:   z.string().describe("Exact semester label"),
        courseCode: z.string().describe("Course code to remove"),
      }),
      execute: async ({ semLabel, courseCode }) => {
        const result = mutRemoveCourse(getSemesters(), semLabel, courseCode);
        if (result.success) setSemesters(result.semesters);
        return result;
      },
    }),

    checkPrerequisites: tool({
      description: "Check what prerequisites a course needs and whether the student meets them by a given semester.",
      inputSchema: z.object({
        courseCode: z.string().describe("Course code to check"),
        bySemLabel: z.string().optional().describe("Semester to check eligibility for (optional)"),
      }),
      execute: async ({ courseCode, bySemLabel }) => {
        const course = COURSES[courseCode];
        if (!course) return { found: false, message: `${courseCode} not in catalog` };

        const semesters = getSemesters();
        let available = initialDone;

        if (bySemLabel) {
          const semIdx = semesters.findIndex((s) => s.label === bySemLabel);
          if (semIdx > 0) {
            const combined = new Set(initialDone);
            for (let i = 0; i < semIdx; i++) semesters[i].courses.forEach((c) => combined.add(c));
            available = combined;
          }
        }

        const missing = course.prereqs.filter((p) => !available.has(p));
        return {
          courseCode,
          courseName: course.title,
          credits: course.credits,
          prereqs: course.prereqs,
          prerequisitesMet: missing.length === 0,
          missingPrereqs: missing,
          isRequired: CS_MAJOR_REQUIRED.includes(courseCode) || CORE_CMP.includes(courseCode),
          isConcentration: CONCENTRATION_COURSES[student.concentration].includes(courseCode),
        };
      },
    }),

    getEligibleCourses: tool({
      description: "Get all courses the student can take in a given semester (prerequisites met by start of that semester).",
      inputSchema: z.object({
        semLabel: z.string().describe("Exact semester label to check eligibility for"),
      }),
      execute: async ({ semLabel }) => {
        const semesters = getSemesters();
        const semIdx = semesters.findIndex((s) => s.label === semLabel);
        if (semIdx === -1) return { error: `Semester "${semLabel}" not found` };

        const alreadyScheduled = new Set(semesters.flatMap((s) => s.courses));
        const combined = new Set(initialDone);
        for (let i = 0; i < semIdx; i++) semesters[i].courses.forEach((c) => combined.add(c));

        const eligible = Object.keys(COURSES).filter(
          (code) => !combined.has(code) && !alreadyScheduled.has(code) && prereqsMet(code, combined)
        );

        const coreEligible = eligible.filter((c) => CS_MAJOR_REQUIRED.includes(c) || CORE_CMP.includes(c));
        const concEligible = eligible.filter((c) => CONCENTRATION_COURSES[student.concentration].includes(c));
        const mathEligible = eligible.filter((c) => c.startsWith("MTH") || c.startsWith("PHY"));
        const other        = eligible.filter((c) => !coreEligible.includes(c) && !concEligible.includes(c) && !mathEligible.includes(c));

        return {
          semLabel,
          coreRequired:   coreEligible.map((c) => ({ code: c, name: COURSES[c]?.title, credits: COURSES[c]?.credits })),
          concentration:  concEligible.map((c) => ({ code: c, name: COURSES[c]?.title, credits: COURSES[c]?.credits })),
          mathPhysics:    mathEligible.map((c) => ({ code: c, name: COURSES[c]?.title, credits: COURSES[c]?.credits })),
          other:          other.slice(0, 10).map((c) => ({ code: c, name: COURSES[c]?.title, credits: COURSES[c]?.credits })),
        };
      },
    }),
  };
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireSession(req);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });

  let student: StudentData;
  let incomingSemesters: ScheduledSemester[];
  let messages: { role: string; content: string }[];

  try {
    const body = await req.json();
    student            = body.student;
    incomingSemesters  = body.semesters;
    messages           = body.messages ?? [];
    if (!student?.transcript || !incomingSemesters) throw new Error("Missing required fields");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Mutable schedule state — tools read/write through closures
  let currentSemesters = incomingSemesters;
  const getSemesters = () => currentSemesters;
  const setSemesters = (s: ScheduledSemester[]) => { currentSemesters = s; };

  const systemPrompt = buildSystemPrompt(student, currentSemesters);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    tools: makeTools(getSemesters, setSemesters, student),
    stopWhen: isStepCount(6),
  });

  const changed = currentSemesters !== incomingSemesters;

  return NextResponse.json({
    message: text,
    updatedSemesters: changed ? currentSemesters : null,
  });
}
