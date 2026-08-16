/**
 * Program abstraction — one Program per major.
 *
 * The wizard, scheduler, chatbot and advisor all read from a Program rather
 * than importing CS-specific constants directly. This lets the same UI serve
 * every major: swap the Program, get a different planner.
 *
 * Adding a new major is a data-only change: extract courses to `COURSES`, then
 * define a new Program here and register it in `PROGRAMS`. No UI code changes.
 */

import {
  COURSES,
  CS_MAJOR_REQUIRED,
  CONCENTRATION_COURSES,
  CORE_CMP,
  PROGRAM_ELECTIVES,
  GENED_FIXED,
  GENED_GROUPS,
  FILLER_POOL,
  TOTAL_CREDITS_REQUIRED,
  MATH_MAJOR_REQUIRED,
  MATH_MAJOR_ELECTIVES,
  MATH_PROGRAMMING_OPTIONS,
  type GenEdGroup,
} from "./data";

export interface ProgramConcentration {
  /** Stable identifier stored in StudentData.concentration. */
  slug: string;
  /** Full name shown in the UI (e.g. "Cybersecurity"). */
  label: string;
  /** Emoji or short icon for the concentration card. */
  icon: string;
  /** One-line description under the card. */
  description: string;
  /** Tailwind gradient — mirrors the CS UI aesthetic. */
  gradient: string;
  /** Courses this concentration adds on top of the major's required list. */
  courses: string[];
}

export interface Program {
  /** Kebab-case slug matching majorSlug() in careers.ts. */
  slug: string;
  /** Human-readable major name (e.g. "Computer Science"). */
  major: string;
  /** Bulletin-declared total credits (e.g. 125). */
  totalCredits: number;
  /** Courses every student in this major takes. */
  required: string[];
  /** Concentration options; empty array means no concentration choice. */
  concentrations: ProgramConcentration[];
  /**
   * Additional major-specific courses that don't belong to a concentration
   * (e.g. CS uses CORE_CMP for MTH 237 / MTH 453 across all concentrations).
   */
  coreExtras: string[];
  /** Program electives — courses that count but can be satisfied via transfer. */
  programElectives: string[];
  /** Fixed gen-ed courses (ENG 101, ENG 102, MTH 125, etc.). */
  genedFixed: string[];
  /** Gen-ed choice groups (Literature, Fine Arts, History, Social/Behavioral). */
  genedGroups: GenEdGroup[];
  /** Pool of extra courses used to fill semesters up to the credit minimum. */
  fillerPool: string[];
  /** Free elective slugs. */
  freeElectives: string[];
  /**
   * Prefix used for the per-semester "major-course cap" — the scheduler caps
   * how many courses starting with this prefix land in one semester (default 3)
   * to keep the load balanced. e.g. "CS " for CS, "MTH " for Mathematics.
   * Trailing space matters — prevents "CSE" from matching "CS ".
   */
  majorPrefix: string;
  /**
   * Prefixes whose courses count as "high priority" during scheduling, in
   * addition to the required + concentration + coreExtras lists.
   * CS depends on math/physics, so CS uses ["CS ", "MTH", "PHY"]. Math only
   * fronts MTH. Set matches how each major sequences dependencies.
   */
  priorityPrefixes: string[];
  /**
   * Courses to front-load (schedule as early as prereqs allow) — typically the
   * calculus + physics sequence for STEM majors, so downstream courses aren't
   * blocked.
   */
  frontLoad: string[];
}

const CS_PROGRAM: Program = {
  slug: "computer-science",
  major: "Computer Science",
  totalCredits: TOTAL_CREDITS_REQUIRED,
  required: CS_MAJOR_REQUIRED,
  concentrations: [
    {
      slug: "AI",
      label: "Artificial Intelligence",
      icon: "🤖",
      description: "Machine learning, robotics, computer vision, and AI fundamentals.",
      gradient: "from-maroon-600 to-maroon-800",
      courses: CONCENTRATION_COURSES.AI,
    },
    {
      slug: "CYB",
      label: "Cybersecurity",
      icon: "🔐",
      description: "Information security, cryptography, forensics, and network defense.",
      gradient: "from-gold-500 to-gold-700",
      courses: CONCENTRATION_COURSES.CYB,
    },
    {
      slug: "GCS",
      label: "General Computer Science",
      icon: "💻",
      description: "Broad CS foundation with flexible elective choices.",
      gradient: "from-slate-600 to-slate-800",
      courses: CONCENTRATION_COURSES.GCS,
    },
  ],
  coreExtras: CORE_CMP,
  programElectives: PROGRAM_ELECTIVES,
  genedFixed: GENED_FIXED,
  genedGroups: GENED_GROUPS,
  fillerPool: FILLER_POOL,
  freeElectives: [],
  majorPrefix: "CS ",
  priorityPrefixes: ["CS ", "MTH", "PHY"],
  frontLoad: ["MTH 125", "MTH 126", "PHY 213", "PHY 214"],
};

/**
 * Mathematics program (Bulletin p.214, 120 credits).
 *
 * Math has no formal concentrations in the bulletin — students pick MTH major
 * electives freely. Modelled here as a single "General Mathematics" pseudo-
 * concentration that carries the required electives, so the wizard's
 * concentration step still has something to render.
 */
const MATH_PROGRAM: Program = {
  slug: "mathematics",
  major: "Mathematics",
  totalCredits: 120,
  required: MATH_MAJOR_REQUIRED,
  concentrations: [
    {
      slug: "GENERAL",
      label: "General Mathematics",
      icon: "∑",
      description: "The standard Math BS — two approved major electives from the bulletin list.",
      gradient: "from-maroon-600 to-maroon-800",
      courses: MATH_MAJOR_ELECTIVES.slice(0, 2), // sample selection; students can adjust
    },
  ],
  coreExtras: [],
  // Programming is required (CS 102, EE 109, EGC 104 or ME 104 — pick one).
  programElectives: MATH_PROGRAMMING_OPTIONS,
  genedFixed: [
    // Math doesn't require PHY 213/214 in gen-ed the way CS does.
    "ENG 101", "ENG 102", "MTH 125", "MTH 126",
    "ORI 101", "ORI 102", "HED 101", "ECO 231",
  ],
  genedGroups: GENED_GROUPS,
  fillerPool: FILLER_POOL,
  freeElectives: [],
  majorPrefix: "MTH ",
  priorityPrefixes: ["MTH"],
  frontLoad: ["MTH 125", "MTH 126", "MTH 227", "MTH 237", "MTH 238"],
};

/** Every program the interactive planner supports. */
export const PROGRAMS: Record<string, Program> = {
  [CS_PROGRAM.slug]: CS_PROGRAM,
  [MATH_PROGRAM.slug]: MATH_PROGRAM,
};

/** Default major used for pre-existing saved plans that predate `major`. */
export const DEFAULT_MAJOR = "computer-science";

/**
 * Get the Program for a major slug, falling back to CS for legacy data.
 * Always returns a valid Program — no undefined checks needed at callsites.
 */
export function getProgram(major: string | undefined): Program {
  return PROGRAMS[major ?? DEFAULT_MAJOR] ?? PROGRAMS[DEFAULT_MAJOR];
}

/** True when a major has a full interactive planner (not just a curriculum viewer). */
export function hasProgram(major: string): boolean {
  return major in PROGRAMS;
}

/** Sample transcript entries for a new student's first semester in this program. */
export function firstSemesterCourses(major: string): string[] {
  const p = getProgram(major);
  // Courses with no prereqs from the required list, capped at ~15 credits.
  return p.required.filter((c) => (COURSES[c]?.prereqs.length ?? 0) === 0).slice(0, 5);
}
