import { z } from "zod";

// ─── Zod schema — the exact shape generateObject must return ─────────────────

export const AdvisorReportSchema = z.object({
  studentSummary: z.object({
    creditsCompleted: z.number().describe("Total passing credit hours completed"),
    creditsRemaining: z.number().describe("Credit hours still needed to reach 125"),
    estimatedGraduation: z.string().describe("Semester and year, e.g. 'Spring 2028'"),
    onTrack: z.boolean().describe("True if progressing normally toward 4-year completion"),
    academicStanding: z
      .enum(["excellent", "good", "caution", "at_risk"])
      .describe("excellent=GPA≥3.5, good=3.0-3.49, caution=2.0-2.99, at_risk=<2.0"),
    standingNote: z.string().describe("1-2 sentence personalized academic standing message"),
  }),

  concentrationAnalysis: z.object({
    recommended: z
      .enum(["CYB", "AI", "GCS"])
      .describe("Best concentration based on completed courses, grades, and remaining work"),
    recommendationReason: z
      .string()
      .describe("2-3 sentences explaining why this concentration fits this student"),
    fits: z.array(
      z.object({
        code: z.enum(["CYB", "AI", "GCS"]),
        name: z.string(),
        completedCount: z.number().describe("Concentration courses already passed"),
        totalRequired: z.number().describe("Total required courses for this concentration"),
        remainingCourses: z.array(z.string()).describe("Course codes still needed"),
        completionPercentage: z.number().min(0).max(100),
        meetsGpaRequirement: z.boolean().describe("Student GPA >= 2.0 required"),
      })
    ),
  }),

  nextSemesterPlan: z
    .array(
      z.object({
        code: z.string().describe("Course code e.g. CS 381"),
        name: z.string().describe("Full course name"),
        credits: z.number(),
        priority: z.enum(["required", "concentration", "math", "recommended"]),
        reason: z
          .string()
          .describe("Why specifically this course now — reference prereqs unlocked or progression"),
        prerequisitesMet: z.boolean(),
      })
    )
    .describe(
      "Recommended courses for the very next semester. Total credits must be 12-18. Only include courses whose prerequisites are already met."
    ),

  prerequisiteWarnings: z.array(
    z.object({
      course: z.string().describe("Course code with the issue"),
      courseName: z.string(),
      issue: z.string().describe("Concise description of the prerequisite problem"),
      missingPrereqs: z.array(z.string()).describe("Missing prerequisite course codes"),
      recommendation: z
        .string()
        .describe("Actionable advice: what to take first, or how to resolve"),
      severity: z.enum(["error", "warning"]).describe("error=hard block, warning=standing/GPA requirement"),
    })
  ),

  fullRoadmap: z
    .array(
      z.object({
        semesterLabel: z.string().describe("e.g. 'Fall 2026'"),
        semesterNumber: z.number().describe("Sequential number starting from 1"),
        courses: z.array(
          z.object({
            code: z.string(),
            name: z.string(),
            credits: z.number(),
            type: z.enum(["core", "concentration", "gen_ed", "math", "elective"]),
          })
        ),
        totalCredits: z.number(),
        notes: z.string().describe("Note about this semester, or empty string if none"),
      })
    )
    .describe(
      "Complete remaining semester plan until graduation. Use only courses whose prerequisites will be met by that point in the plan."
    ),

  aiInsights: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe(
      "3-5 personalized, specific, actionable insights. Reference actual courses and situations. Not generic advice."
    ),

  concerns: z
    .array(z.string())
    .describe(
      "0-3 specific concerns this student should raise with their official academic advisor. Only include genuine issues."
    ),
});

export type AdvisorReport = z.infer<typeof AdvisorReportSchema>;

// ─── Computed facts (deterministic, no AI) ────────────────────────────────────

export interface PrereqWarning {
  course: string;
  courseName: string;
  missing: string[];
  severity: "error" | "warning";
}

export interface ConcentrationProgress {
  /** Concentration slug — CS uses "CYB"/"AI"/"GCS", other majors use their own slugs. */
  code: string;
  name: string;
  required: string[];
  completed: string[];
  remaining: string[];
  pct: number;
}

export interface ComputedFacts {
  completedCodes: string[];
  registeredCodes: string[];
  failedCodes: string[];
  creditsCompleted: number;
  prereqWarnings: PrereqWarning[];
  concentrationProgress: ConcentrationProgress[];
  eligibleNextCourses: string[];
  remainingCore: string[];
  scheduleResult: import("./scheduler").ScheduleResult;
}
