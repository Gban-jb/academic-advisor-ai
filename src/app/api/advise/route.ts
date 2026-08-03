import { NextRequest, NextResponse } from "next/server";
import { generateText, generateObject, tool, isStepCount } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { COURSES, CS_MAJOR_REQUIRED, CONCENTRATION_COURSES, GENED_FIXED, GENED_GROUPS, CORE_CMP, type StudentData, type Concentration } from "@/lib/data";
import { prereqsMet, getDoneSet, getRegisteredSet, type ScheduleResult, type ScheduledSemester } from "@/lib/scheduler";
import { computeAdvisorFacts, buildAdvisorSystemPrompt } from "@/lib/advisor-engine";
import { AdvisorReportSchema, type AdvisorReport } from "@/lib/advisor-types";

const CONC_NAMES: Record<Concentration, string> = {
  CYB: "Cybersecurity",
  AI: "Artificial Intelligence",
  GCS: "General Computer Science",
};

// ── Optional: query Pinecone for RAG context ──────────────────────────────────
async function queryPinecone(queries: string[]): Promise<string> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !indexName || !openaiKey) return "";

  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const oai = (await import("openai")).default;
    const pc = new Pinecone({ apiKey });
    const index = pc.index(indexName);
    const client = new oai({ apiKey: openaiKey });

    const results: string[] = [];
    for (const query of queries.slice(0, 3)) {
      const embRes = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const vector = embRes.data[0].embedding;
      const qRes = await index.query({ vector, topK: 3, includeMetadata: true });
      const texts = (qRes.matches ?? [])
        .map((m) => String(m.metadata?.text_summary ?? m.metadata?.description ?? ""))
        .filter(Boolean);
      results.push(...texts);
    }
    return results.slice(0, 6).join("\n---\n").slice(0, 2000);
  } catch {
    return "";
  }
}

// ── Tool definitions (deterministic, called by the AI during analysis) ─────────
function makeTools(student: StudentData) {
  const completedSet = getDoneSet(student.transcript);
  const registeredSet = getRegisteredSet(student.transcript);
  const haveSet = new Set([...Array.from(completedSet), ...Array.from(registeredSet)]);

  return {
    checkCoursePrerequisites: tool({
      description:
        "Check whether a student has completed the prerequisites for a specific course. Returns which prereqs are missing.",
      inputSchema: z.object({
        courseCode: z.string().describe("Course code to check, e.g. CS 384"),
      }),
      execute: async ({ courseCode }) => {
        const course = COURSES[courseCode];
        if (!course) return { found: false, message: `${courseCode} not in catalog` };
        const missing = course.prereqs.filter((p) => !completedSet.has(p));
        const missingRegistered = course.prereqs.filter(
          (p) => !completedSet.has(p) && registeredSet.has(p)
        );
        return {
          courseCode,
          courseName: course.title,
          credits: course.credits,
          allPrereqs: course.prereqs,
          prerequisitesMet: missing.length === 0,
          missingPrereqs: missing,
          missingNames: missing.map((p) => COURSES[p]?.title ?? p),
          note: missingRegistered.length
            ? `Student is currently registered for ${missingRegistered.join(", ")} — will count next semester`
            : undefined,
        };
      },
    }),

    getConcentrationAnalysis: tool({
      description:
        "Analyze how far along a student is in a specific concentration and which courses remain.",
      inputSchema: z.object({
        concentration: z.enum(["CYB", "AI", "GCS"]).describe("Concentration to analyze"),
      }),
      execute: async ({ concentration }) => {
        const required = CONCENTRATION_COURSES[concentration];
        const completed = required.filter((c) => completedSet.has(c));
        const inProgress = required.filter((c) => registeredSet.has(c));
        const remaining = required.filter((c) => !haveSet.has(c));
        const eligible = remaining.filter((c) => prereqsMet(c, haveSet));
        return {
          concentration,
          name: CONC_NAMES[concentration],
          totalRequired: required.length,
          completed: completed.map((c) => ({ code: c, name: COURSES[c]?.title })),
          inProgress: inProgress.map((c) => ({ code: c, name: COURSES[c]?.title })),
          remaining: remaining.map((c) => ({ code: c, name: COURSES[c]?.title })),
          eligibleToTakeNow: eligible.map((c) => ({ code: c, name: COURSES[c]?.title })),
          completionPct: Math.round((completed.length / required.length) * 100),
          meetsGpaRequirement: student.gpa >= 2.0,
          totalHours: required.length * 3,
        };
      },
    }),

    getEligibleNextCourses: tool({
      description:
        "Returns all courses the student can take next semester (prerequisites satisfied). Use to build the next semester plan.",
      inputSchema: z.object({
        prioritize: z
          .enum(["core", "concentration", "math", "any"])
          .describe("Which category to surface first"),
      }),
      execute: async ({ prioritize }) => {
        const allCS = Object.keys(COURSES);
        const eligible = allCS.filter((code) => {
          if (haveSet.has(code)) return false;
          return prereqsMet(code, haveSet);
        });
        const coreEligible = eligible.filter((c) => CS_MAJOR_REQUIRED.includes(c));
        const concEligible = eligible.filter((c) =>
          CONCENTRATION_COURSES[student.concentration].includes(c)
        );
        const mathEligible = eligible.filter((c) => c.startsWith("MTH"));
        const csElectives = eligible.filter(
          (c) =>
            c.startsWith("CS") &&
            !CS_MAJOR_REQUIRED.includes(c) &&
            !CONCENTRATION_COURSES[student.concentration].includes(c)
        );
        const genEdEligible = eligible.filter(
          (c) =>
            !c.startsWith("CS") &&
            !c.startsWith("MTH") &&
            !CS_MAJOR_REQUIRED.includes(c) &&
            !CONCENTRATION_COURSES[student.concentration].includes(c)
        );
        return {
          prioritize,
          coreRequired: coreEligible.map((c) => ({
            code: c,
            name: COURSES[c]?.title,
            credits: COURSES[c]?.credits,
          })),
          concentrationCourses: concEligible.map((c) => ({
            code: c,
            name: COURSES[c]?.title,
            credits: COURSES[c]?.credits,
          })),
          mathCourses: mathEligible.map((c) => ({
            code: c,
            name: COURSES[c]?.title,
            credits: COURSES[c]?.credits,
          })),
          csElectives: csElectives.slice(0, 8).map((c) => ({
            code: c,
            name: COURSES[c]?.title,
            credits: COURSES[c]?.credits,
          })),
          genEdEligible: genEdEligible.map((c) => ({
            code: c,
            name: COURSES[c]?.title,
            credits: COURSES[c]?.credits,
          })),
        };
      },
    }),

    analyzeAcademicProgress: tool({
      description:
        "Get a holistic view of the student's academic standing: credit counts, GPA analysis, failed courses, and degree completion estimate.",
      inputSchema: z.object({}),
      execute: async () => {
        const completedCredits = student.transcript
          .filter((e) => completedSet.has(e.code))
          .reduce((s, e) => s + e.credits, 0);
        const remainingCore = CS_MAJOR_REQUIRED.filter((c) => !haveSet.has(c));
        const highGrades = student.transcript.filter((e) =>
          ["A+", "A", "A-"].includes(e.grade)
        );
        const failedCodes = Array.from(getRegisteredSet(student.transcript))
          .filter((c) => !completedSet.has(c));
        return {
          creditsCompleted: completedCredits,
          creditsRemaining: 125 - completedCredits,
          percentComplete: Math.round((completedCredits / 125) * 100),
          gpa: student.gpa,
          gpaCategory:
            student.gpa >= 3.5
              ? "excellent"
              : student.gpa >= 3.0
              ? "good"
              : student.gpa >= 2.0
              ? "satisfactory"
              : "at_risk",
          highGradeCourses: highGrades.map((e) => e.code),
          remainingCoreRequired: remainingCore,
          totalCoursesCompleted: completedSet.size,
          selectedConcentration: student.concentration,
        };
      },
    }),
  };
}

// ── Deterministic roadmap builder (mirrors scheduler output → advisor schema) ──

function getCourseType(
  code: string,
  concentration: Concentration
): "core" | "concentration" | "gen_ed" | "math" | "elective" {
  if (CS_MAJOR_REQUIRED.includes(code) || CORE_CMP.includes(code)) return "core";
  if (CONCENTRATION_COURSES[concentration].includes(code)) return "concentration";
  if (code.startsWith("MTH") || code.startsWith("PHY")) return "math";
  const isGenEd =
    GENED_FIXED.includes(code) ||
    GENED_GROUPS.some((g) => g.options.some((opt) => opt.includes(code)));
  if (isGenEd) return "gen_ed";
  return "elective";
}

function getCourseReason(code: string, concentration: Concentration, sem: ScheduledSemester): string {
  if (sem.retakes.includes(code)) return "Retake — previously not passed; must complete for degree.";
  if (sem.fillerCourses.includes(code)) return "Elective added to meet the 12-credit full-time minimum.";
  if (CS_MAJOR_REQUIRED.includes(code) || CORE_CMP.includes(code)) return "Required CS core course for degree completion.";
  if (CONCENTRATION_COURSES[concentration].includes(code)) return `${concentration} concentration requirement.`;
  if (code.startsWith("MTH") || code.startsWith("PHY")) return "Math/science sequence required for advanced CS courses.";
  return "General education or elective requirement.";
}

function buildRoadmapFromSchedule(
  semesters: ScheduledSemester[],
  concentration: Concentration
): AdvisorReport["fullRoadmap"] {
  return semesters.map((sem, i) => ({
    semesterLabel: sem.label,
    semesterNumber: i + 1,
    courses: sem.courses.map((code) => {
      const course = COURSES[code];
      return {
        code,
        name: course?.title ?? code,
        credits: course?.credits ?? 3,
        type: getCourseType(code, concentration),
      };
    }),
    totalCredits: sem.totalCredits,
    notes: sem.warnings.join(" ") || (sem.isExtension ? "Extension semester — electives to maintain full-time status." : ""),
  }));
}

function buildNextSemPlan(
  semesters: ScheduledSemester[],
  concentration: Concentration,
  haveSet: Set<string>
): AdvisorReport["nextSemesterPlan"] {
  const targetSem = semesters[0];
  if (!targetSem) return [];
  return targetSem.courses.map((code) => {
    const course = COURSES[code];
    const type = getCourseType(code, concentration);
    return {
      code,
      name: course?.title ?? code,
      credits: course?.credits ?? 3,
      priority:
        type === "core"
          ? "required"
          : type === "concentration"
          ? "concentration"
          : type === "math"
          ? "math"
          : "recommended",
      reason: getCourseReason(code, concentration, targetSem),
      prerequisitesMet: prereqsMet(code, haveSet),
    };
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });
  }

  let student: StudentData;
  let scheduleResult: ScheduleResult | null = null;
  try {
    const body = await req.json();
    student = body.student;
    scheduleResult = body.scheduleResult ?? null;
    if (!student?.transcript) throw new Error("Missing student.transcript");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ── Step 1: Deterministic facts ────────────────────────────────────────────
  const facts = computeAdvisorFacts(student);

  // ── Step 2: Optional Pinecone RAG context ──────────────────────────────────
  const pineconeQueries = [
    `CS degree requirements AAMU concentration ${student.concentration}`,
    `prerequisite chain ${facts.remainingCore.slice(0, 3).join(" ")}`,
  ];
  const ragContext = await queryPinecone(pineconeQueries);

  // ── Step 3: Tool-augmented analysis with gpt-4o-mini ──────────────────────
  const systemPrompt = buildAdvisorSystemPrompt(student, facts, ragContext);

  let toolSummary = "";
  try {
    const toolResponse = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are an AAMU CS academic advisor assistant. Use the provided tools to thoroughly analyze this student's situation before generating an advising report. Call each tool at least once.`,
      prompt: `Analyze ${student.name || "this student"}'s academic record:
- GPA: ${student.gpa}, Concentration: ${student.concentration}
- Completed: ${facts.completedCodes.join(", ") || "none"}
- Registered: ${facts.registeredCodes.join(", ") || "none"}
- Failed: ${facts.failedCodes.join(", ") || "none"}

Step 1: Check academic progress overview.
Step 2: Analyze their chosen concentration (${student.concentration}) fit.
Step 3: Get eligible courses for next semester prioritizing core and concentration.
Step 4: Spot-check prerequisites for any flagged concern courses.`,
      tools: makeTools(student),
      stopWhen: isStepCount(6),
    });

    // Collect all tool results into a summary
    const toolTexts: string[] = [];
    for (const step of toolResponse.steps ?? []) {
      for (const result of step.staticToolResults ?? []) {
        toolTexts.push(`[${result.toolName}]: ${JSON.stringify(result.output)}`);
      }
    }
    toolSummary = toolTexts.join("\n\n");
  } catch (err) {
    console.error("Tool phase error (non-fatal):", err);
  }

  // ── Step 4: Structured report generation ──────────────────────────────────
  const scheduleContext =
    scheduleResult && scheduleResult.semesters.length > 0
      ? `\n\nIMPORTANT — The student's planner has already computed the exact schedule. Use it as the authoritative reference:\n${scheduleResult.semesters
          .map(
            (sem, i) =>
              `Semester ${i + 1} (${sem.label}): ${sem.courses.join(", ")} [${sem.totalCredits} cr]`
          )
          .join("\n")}`
      : "";

  const { object: report } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: `Generate the complete advising report for ${student.name || "this student"}.

Additional analysis from tool calls:
${toolSummary || "(No tool results — use pre-computed facts from system prompt only)"}${scheduleContext}

Rules reminder:
- nextSemesterPlan total credits: 12-18
- Only include courses from the eligible list
- fullRoadmap must respect prerequisite order
- Be specific and actionable in all text fields`,
    schema: AdvisorReportSchema,
  });

  // Override nextSemesterPlan and fullRoadmap with the deterministic scheduler output
  // so the AI report always matches the planner on screen.
  const haveSet = new Set([
    ...Array.from(getDoneSet(student.transcript)),
    ...Array.from(getRegisteredSet(student.transcript)),
  ]);

  const finalReport: AdvisorReport = {
    ...report,
    ...(scheduleResult && scheduleResult.semesters.length > 0
      ? {
          nextSemesterPlan: buildNextSemPlan(scheduleResult.semesters, student.concentration, haveSet),
          fullRoadmap: buildRoadmapFromSchedule(scheduleResult.semesters, student.concentration),
        }
      : {}),
  };

  return NextResponse.json({ report: finalReport, facts });
}
