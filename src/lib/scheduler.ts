import {
  COURSES, FREE_ELECTIVES,
  CREDIT_MIN, CREDIT_MAX,
  EXPECTED_SEMESTERS,
  gradeIsPassing, gradeIsRegistered,
  type Concentration, type StudentData, type TranscriptEntry,
} from "./data";
import { getProgram, type Program } from "./programs";

/**
 * True when a course is high-priority for scheduling — required or
 * concentration-driven for this program, or falls under one of the program's
 * priority prefixes (e.g. math + physics for CS, math for Math).
 */
function isHighPriority(
  code: string,
  concentration: Concentration,
  program: Program
): boolean {
  const conc = program.concentrations.find((c) => c.slug === concentration);
  return (
    program.required.includes(code) ||
    (conc?.courses.includes(code) ?? false) ||
    program.coreExtras.includes(code) ||
    program.priorityPrefixes.some((p) => code.startsWith(p))
  );
}

export interface ScheduledSemester {
  label: string;
  courses: string[];
  totalCredits: number;
  load: "light" | "standard" | "full" | "max";
  retakes: string[];
  warnings: string[];
  fillerCourses: string[];  // courses added purely to meet the 12-credit minimum
  isExtension: boolean;     // semester built entirely from fillers (spread-out mode)
}

export interface ScheduleResult {
  semesters: ScheduledSemester[];
  graduationSemester: string;
  totalRemaining: number;
  completedCredits: number;
  expectedSemesters: number;
  earlyGraduationPossible: boolean;
  creditTargetOverridden: boolean;
  effectiveCreditTarget: number;
}

export function getDoneSet(transcript: TranscriptEntry[]): Set<string> {
  const done = new Set<string>();
  for (const entry of transcript) {
    if (gradeIsPassing(entry.grade)) done.add(entry.code);
  }
  return done;
}

export function getRegisteredSet(transcript: TranscriptEntry[]): Set<string> {
  const reg = new Set<string>();
  for (const entry of transcript) {
    if (gradeIsRegistered(entry.grade)) reg.add(entry.code);
  }
  return reg;
}

export function getFailedSet(transcript: TranscriptEntry[]): Set<string> {
  const failed = new Set<string>();
  const passed = getDoneSet(transcript);
  for (const entry of transcript) {
    if (!gradeIsPassing(entry.grade) && !gradeIsRegistered(entry.grade)) {
      if (!passed.has(entry.code)) failed.add(entry.code);
    }
  }
  return failed;
}

export function prereqsMet(courseCode: string, completed: Set<string>): boolean {
  const course = COURSES[courseCode];
  if (!course) return true;
  return course.prereqs.every((p) => completed.has(p));
}

function creditLoadLabel(credits: number): ScheduledSemester["load"] {
  if (credits <= 14) return "light";
  if (credits === 15) return "standard";
  if (credits <= 17) return "full";
  return "max";
}

// Returns courses eligible to pad a short semester, in priority order:
// 1. Student's chosen interest courses (not in required queue or done)
// 2. Program's fillerPool (same exclusion)
function buildFillerPool(
  student: StudentData,
  program: Program,
  completed: Set<string>,
  remaining: string[]
): string[] {
  const remainingSet = new Set(remaining);
  const pool: string[] = [];

  for (const code of student.interestCourses ?? []) {
    if (!completed.has(code) && !remainingSet.has(code) && COURSES[code]) {
      pool.push(code);
    }
  }

  for (const code of program.fillerPool) {
    if (!completed.has(code) && !remainingSet.has(code) && !pool.includes(code)) {
      pool.push(code);
    }
  }

  return pool;
}

function buildQueue(student: StudentData, program: Program): string[] {
  const done = getDoneSet(student.transcript);
  const registered = getRegisteredSet(student.transcript);
  const alreadyHave = new Set(Array.from(done).concat(Array.from(registered)));

  const needed: string[] = [];
  const addIfMissing = (code: string) => {
    if (!alreadyHave.has(code) && !needed.includes(code)) needed.push(code);
  };

  // Front-load the program's dependency spine (e.g. Calculus + Physics for CS)
  // before major-specific courses so downstream prereqs don't stall.
  program.frontLoad.forEach(addIfMissing);
  program.required.forEach(addIfMissing);
  const conc = program.concentrations.find((c) => c.slug === student.concentration);
  (conc?.courses ?? []).forEach(addIfMissing);
  program.coreExtras.forEach(addIfMissing);
  program.programElectives.forEach(addIfMissing);
  program.genedFixed.forEach(addIfMissing);

  for (const group of program.genedGroups) {
    const alreadySatisfied = group.options.some((opt) =>
      opt.every((c) => alreadyHave.has(c))
    );
    if (alreadySatisfied) continue;

    const partialOption = group.options.find((opt) =>
      opt.some((c) => alreadyHave.has(c))
    );
    const chosenOption = partialOption ?? group.options[0];
    chosenOption.forEach(addIfMissing);
  }

  FREE_ELECTIVES.forEach(addIfMissing);
  program.freeElectives.forEach(addIfMissing);
  return needed;
}

function semesterLabel(index: number, startTerm: string): string {
  const parts = startTerm.split(" ");
  let season = parts[0] as "Fall" | "Spring";
  let year = parseInt(parts[1], 10);
  for (let i = 0; i < index; i++) {
    if (season === "Fall") { season = "Spring"; year += 1; }
    else                   { season = "Fall"; }
  }
  return `${season} ${year}`;
}

export function buildSchedule(
  student: StudentData,
  opts?: { overrideSemesters?: number }
): ScheduleResult {
  const program = getProgram(student.major);
  const done = getDoneSet(student.transcript);
  const registered = getRegisteredSet(student.transcript);
  const failed = getFailedSet(student.transcript);

  // Semester 1 = pre-registered courses (already locked in)
  const sem1Courses = Array.from(registered);
  const sem1Credits = sem1Courses.reduce((s, c) => s + (COURSES[c]?.credits ?? 3), 0);

  const semesters: ScheduledSemester[] = [];
  if (sem1Courses.length > 0) {
    semesters.push({
      label: "Fall 2026 (Pre-registered)",
      courses: sem1Courses,
      totalCredits: sem1Credits,
      load: creditLoadLabel(sem1Credits),
      retakes: [],
      warnings: sem1Credits < CREDIT_MIN
        ? [`Pre-registered for only ${sem1Credits} credits — consider adding courses to meet the 12-credit full-time minimum.`]
        : [],
      fillerCourses: [],
      isExtension: false,
    });
  }

  const completedAfterSem1 = new Set([...done, ...registered]);

  const queue = buildQueue(student, program);
  const retakeQueue = Array.from(failed).filter((c) => !registered.has(c));
  const mainQueue = queue.filter((c) => !retakeQueue.includes(c));
  const fullQueue = [...retakeQueue, ...mainQueue];

  const expectedSems = EXPECTED_SEMESTERS[student.classification ?? "frosh1"];
  const rawTarget = student.creditTarget ?? 15;
  const alreadyDoneCredits = Array.from(completedAfterSem1).reduce(
    (s, c) => s + (COURSES[c]?.credits ?? 3), 0
  );
  const remainingCreditsTotal = program.totalCredits - alreadyDoneCredits;
  // sem1 (pre-registered) already occupies one expected slot; remaining courses
  // must fit in the future semesters only.
  const futureSemCount = Math.max(1, expectedSems - (sem1Courses.length > 0 ? 1 : 0));
  const minTargetForTimeline = Math.ceil(remainingCreditsTotal / futureSemCount);
  const neededTarget = Math.min(minTargetForTimeline, CREDIT_MAX);
  const creditTargetOverridden = rawTarget < neededTarget;
  const baseTarget = creditTargetOverridden ? neededTarget : rawTarget;
  const targetSems = opts?.overrideSemesters ?? null;

  const completed = new Set(completedAfterSem1);
  let remaining = fullQueue.filter((c) => !completed.has(c));
  let semIndex = semesters.length;
  const MAX_SEMESTERS = 20;
  const firstFutureSemIdx = semIndex;

  // ── Main scheduling loop ────────────────────────────────────────────────────
  while (remaining.length > 0 && semIndex < MAX_SEMESTERS) {
    const semCourses: string[] = [];
    const semRetakes: string[] = [];
    const semWarnings: string[] = [];
    const semFillers: string[] = [];
    let semCredits = 0;

    const available = remaining.filter((c) => prereqsMet(c, completed));

    if (available.length === 0) {
      semWarnings.push(`Cannot schedule remaining courses: ${remaining.join(", ")}`);
      semesters.push({
        label: semesterLabel(semIndex, "Fall 2026"),
        courses: [],
        totalCredits: 0,
        load: "light",
        retakes: semRetakes,
        warnings: semWarnings,
        fillerCourses: [],
        isExtension: false,
      });
      break;
    }

    // Ascending ramp: spread-out mode starts light and grows to baseTarget
    let semTarget: number;
    if (targetSems !== null && targetSems > 1) {
      const relIdx = semIndex - firstFutureSemIdx;
      semTarget = Math.round(
        CREDIT_MIN + ((baseTarget - CREDIT_MIN) * relIdx) / Math.max(1, targetSems - 1)
      );
      semTarget = Math.max(CREDIT_MIN, Math.min(CREDIT_MAX, semTarget));
    } else {
      semTarget = baseTarget;
    }

    const highPriority = available.filter((c) => isHighPriority(c, student.concentration, program));
    const genEdFiller  = available.filter((c) => !isHighPriority(c, student.concentration, program));

    const tryAdd = (code: string) => {
      const credits = COURSES[code]?.credits ?? 3;
      if (semCredits + credits > CREDIT_MAX) return false;
      semCourses.push(code);
      semCredits += credits;
      if (retakeQueue.includes(code)) semRetakes.push(code);
      return true;
    };

    // Per-major course cap: preferred 3 per semester, raised automatically when
    // behind schedule so all major courses fit within remaining time.
    const isMajorCourse = (code: string) => code.startsWith(program.majorPrefix);
    const MAJOR_PREFERRED_CAP = 3;
    const allMajorRemaining = remaining.filter((c) => isMajorCourse(c)).length;
    const semsScheduledSoFar = semIndex - firstFutureSemIdx;
    const semsLeft = Math.max(1, futureSemCount - semsScheduledSoFar);
    const dynamicMajorCap = Math.max(MAJOR_PREFERRED_CAP, Math.ceil(allMajorRemaining / semsLeft));
    let majorAdded = 0;

    // When behind schedule, raise the high-priority threshold to semTarget so
    // required courses fill first and gen-ed takes whatever space is left.
    const HIGH_CAP = Math.round(semTarget * 0.67);
    const effectiveHighCap = dynamicMajorCap > MAJOR_PREFERRED_CAP ? semTarget : HIGH_CAP;

    // Pass 1: fill with high-priority (major/math/physics) up to effectiveHighCap
    for (const code of highPriority) {
      if (semCredits >= effectiveHighCap) break;
      if (isMajorCourse(code) && majorAdded >= dynamicMajorCap) continue;
      if (tryAdd(code) && isMajorCourse(code)) majorAdded++;
    }

    // Pass 2: fill to semTarget with gen-ed (major cap still applies)
    for (const code of genEdFiller) {
      if (semCredits >= semTarget) break;
      if (isMajorCourse(code) && majorAdded >= dynamicMajorCap) continue;
      if (tryAdd(code) && isMajorCourse(code)) majorAdded++;
    }

    // Pass 3: fill remainder with more high-priority if still under target
    for (const code of highPriority) {
      if (semCredits >= semTarget) break;
      if (semCourses.includes(code)) continue;
      if (isMajorCourse(code) && majorAdded >= dynamicMajorCap) continue;
      if (tryAdd(code) && isMajorCourse(code)) majorAdded++;
    }

    // Pass 4: if still under minimum, use anything available
    if (semCredits < CREDIT_MIN) {
      for (const code of available) {
        if (semCredits >= CREDIT_MIN) break;
        if (!semCourses.includes(code)) tryAdd(code);
      }
    }

    // Enforce ≥ 12: top up with filler courses (interest courses first, then program.fillerPool)
    if (semCredits < CREDIT_MIN) {
      const fillers = buildFillerPool(student, program, completed, remaining).filter(
        (c) => !semCourses.includes(c) && prereqsMet(c, completed)
      );

      for (const filler of fillers) {
        if (semCredits >= CREDIT_MIN) break;
        if (isMajorCourse(filler) && majorAdded >= dynamicMajorCap) continue;
        const cr = COURSES[filler]?.credits ?? 3;
        if (semCredits + cr <= CREDIT_MAX) {
          semCourses.push(filler);
          semCredits += cr;
          semFillers.push(filler);
          if (isMajorCourse(filler)) majorAdded++;
        }
      }

      if (semCredits < CREDIT_MIN) {
        semWarnings.push(
          `Only ${semCredits} credits available — not enough courses to reach the 12-credit full-time minimum.`
        );
      }
    }

    semesters.push({
      label: semesterLabel(semIndex, "Fall 2026"),
      courses: semCourses,
      totalCredits: semCredits,
      load: creditLoadLabel(semCredits),
      retakes: semRetakes,
      warnings: semWarnings,
      fillerCourses: semFillers,
      isExtension: false,
    });

    semCourses.forEach((c) => completed.add(c));
    remaining = remaining.filter((c) => !completed.has(c));
    semIndex++;
  }

  // Compute early graduation flag BEFORE extension loop
  const earlyGraduationPossible = remaining.length === 0 && semIndex < expectedSems;

  // ── Extension loop: fill remaining expected semesters (spread-out mode only) ──
  // Option B: if filler pool can't guarantee ≥ 12 credits, stop and warn.
  if (targetSems !== null && remaining.length === 0 && semIndex < targetSems) {
    const extTarget = Math.max(CREDIT_MIN, student.extensionCreditTarget ?? CREDIT_MIN);

    while (semIndex < targetSems) {
      const fillers = buildFillerPool(student, program, completed, []).filter(
        (c) => prereqsMet(c, completed)
      );

      // Preflight: can we guarantee ≥ 12 credits from the remaining pool?
      let potential = 0;
      for (const c of fillers) {
        potential += COURSES[c]?.credits ?? 3;
        if (potential >= CREDIT_MIN) break;
      }

      if (potential < CREDIT_MIN) {
        if (semesters.length > 0) {
          semesters[semesters.length - 1].warnings.push(
            "Not enough elective courses for another full-time semester — graduation moved earlier than planned."
          );
        }
        break;
      }

      const extCourses: string[] = [];
      const extFillers: string[] = [];
      let extCredits = 0;

      for (const filler of fillers) {
        if (extCredits >= extTarget) break;
        const cr = COURSES[filler]?.credits ?? 3;
        if (extCredits + cr <= CREDIT_MAX) {
          extCourses.push(filler);
          extCredits += cr;
          extFillers.push(filler);
        }
      }

      semesters.push({
        label: semesterLabel(semIndex, "Fall 2026"),
        courses: extCourses,
        totalCredits: extCredits,
        load: creditLoadLabel(extCredits),
        retakes: [],
        warnings: [],
        fillerCourses: extFillers,
        isExtension: true,
      });

      extCourses.forEach((c) => completed.add(c));
      semIndex++;
    }
  }

  const completedCredits = [...done, ...registered].reduce(
    (s, c) => s + (COURSES[c]?.credits ?? 3), 0
  );
  const lastSem = semesters[semesters.length - 1];

  return {
    semesters,
    graduationSemester: lastSem?.label ?? "Unknown",
    totalRemaining: remaining.length,
    completedCredits,
    expectedSemesters: expectedSems,
    earlyGraduationPossible,
    creditTargetOverridden,
    effectiveCreditTarget: baseTarget,
  };
}
