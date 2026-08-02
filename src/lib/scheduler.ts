import {
  COURSES, CS_MAJOR_REQUIRED, CONCENTRATION_COURSES, CORE_CMP,
  PROGRAM_ELECTIVES, GENED_FIXED, GENED_GROUPS, FREE_ELECTIVES,
  TOTAL_CREDITS_REQUIRED, CREDIT_MIN, CREDIT_MAX,
  EXPECTED_SEMESTERS,
  gradeIsPassing, gradeIsRegistered,
  type Concentration, type StudentData, type TranscriptEntry,
} from "./data";

// Courses that are "CS-track critical" — should be scheduled first each semester
function isHighPriority(code: string, concentration: Concentration): boolean {
  return (
    CS_MAJOR_REQUIRED.includes(code) ||
    CONCENTRATION_COURSES[concentration].includes(code) ||
    CORE_CMP.includes(code) ||
    code.startsWith("MTH") ||   // math prereqs unlock CS courses
    code.startsWith("PHY")      // physics is a fixed gen-ed requirement
  );
}

export interface ScheduledSemester {
  label: string;       // e.g. "Semester 1 (Fall 2026)"
  courses: string[];
  totalCredits: number;
  load: "light" | "standard" | "full" | "max";
  retakes: string[];
  warnings: string[];
}

export interface ScheduleResult {
  semesters: ScheduledSemester[];
  graduationSemester: string;
  totalRemaining: number;
  completedCredits: number;
  expectedSemesters: number;
  earlyGraduationPossible: boolean;
  creditTargetOverridden: boolean;
  effectiveCreditTarget: number; // the per-semester target actually used
}

// Courses with a passing grade in the transcript
export function getDoneSet(transcript: TranscriptEntry[]): Set<string> {
  const done = new Set<string>();
  for (const entry of transcript) {
    if (gradeIsPassing(entry.grade)) done.add(entry.code);
  }
  return done;
}

// Courses the student is currently registered for (REG)
export function getRegisteredSet(transcript: TranscriptEntry[]): Set<string> {
  const reg = new Set<string>();
  for (const entry of transcript) {
    if (gradeIsRegistered(entry.grade)) reg.add(entry.code);
  }
  return reg;
}

// Courses that failed and need to be retaken
export function getFailedSet(transcript: TranscriptEntry[]): Set<string> {
  const failed = new Set<string>();
  const passed = getDoneSet(transcript);
  for (const entry of transcript) {
    if (!gradeIsPassing(entry.grade) && !gradeIsRegistered(entry.grade)) {
      // Only count as failed if never subsequently passed
      if (!passed.has(entry.code)) failed.add(entry.code);
    }
  }
  return failed;
}

// All prereqs satisfied given a set of completed courses
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

// Build the list of courses still needed for the degree
function buildQueue(student: StudentData): string[] {
  const done = getDoneSet(student.transcript);
  const registered = getRegisteredSet(student.transcript);
  const alreadyHave = new Set(Array.from(done).concat(Array.from(registered)));

  const needed: string[] = [];
  const addIfMissing = (code: string) => {
    if (!alreadyHave.has(code) && !needed.includes(code)) needed.push(code);
  };

  // CS Major required (13 courses)
  CS_MAJOR_REQUIRED.forEach(addIfMissing);

  // Concentration
  CONCENTRATION_COURSES[student.concentration].forEach(addIfMissing);

  // Core CMP
  CORE_CMP.forEach(addIfMissing);

  // Program electives
  PROGRAM_ELECTIVES.forEach(addIfMissing);

  // Fixed GenEd
  GENED_FIXED.forEach(addIfMissing);

  // GenEd choice groups — pick first option that student hasn't started
  for (const group of GENED_GROUPS) {
    // Check if any option is already fully satisfied
    const alreadySatisfied = group.options.some((opt) =>
      opt.every((c) => alreadyHave.has(c))
    );
    if (alreadySatisfied) continue;

    // Find the first option where at least one course is already in progress
    const partialOption = group.options.find((opt) =>
      opt.some((c) => alreadyHave.has(c))
    );
    const chosenOption = partialOption ?? group.options[0];
    chosenOption.forEach(addIfMissing);
  }

  // Free electives — fill the gap to 125 total credits
  // Only add courses whose prereqs exist in the COURSES dict
  FREE_ELECTIVES.forEach(addIfMissing);

  return needed;
}

// Determine a semester term label given a starting semester
function semesterLabel(index: number, startTerm: string): string {
  // startTerm like "Fall 2026"
  const parts = startTerm.split(" ");
  let season = parts[0] as "Fall" | "Spring";
  let year = parseInt(parts[1], 10);

  for (let i = 0; i < index; i++) {
    if (season === "Fall") {
      season = "Spring";
      year += 1;
    } else {
      season = "Fall";
    }
  }
  return `${season} ${year}`;
}

export function buildSchedule(
  student: StudentData,
  opts?: { overrideSemesters?: number }
): ScheduleResult {
  const done = getDoneSet(student.transcript);
  const registered = getRegisteredSet(student.transcript);
  const failed = getFailedSet(student.transcript);

  // Semester 1 = the registered courses (already decided)
  const sem1Courses = Array.from(registered);
  const sem1Credits = sem1Courses.reduce(
    (sum, c) => sum + (COURSES[c]?.credits ?? 3), 0
  );

  const semesters: ScheduledSemester[] = [];

  if (sem1Courses.length > 0) {
    semesters.push({
      label: "Fall 2026 (Pre-registered)",
      courses: sem1Courses,
      totalCredits: sem1Credits,
      load: creditLoadLabel(sem1Credits),
      retakes: [],
      warnings: [],
    });
  }

  // After semester 1, registered courses count as done for prereq purposes
  const completedAfterSem1 = new Set(Array.from(done).concat(Array.from(registered)));

  // Build remaining queue
  const queue = buildQueue(student);

  // Add failed courses to the front (highest priority)
  const retakeQueue = Array.from(failed).filter((c) => !registered.has(c));
  const mainQueue = queue.filter((c) => !retakeQueue.includes(c));
  const fullQueue = [...retakeQueue, ...mainQueue];

  // ── Determine effective credit target ───────────────────────────────────
  const expectedSems = EXPECTED_SEMESTERS[student.classification ?? "frosh1"];
  const rawTarget = student.creditTarget ?? 15;
  const alreadyDoneCredits = Array.from(completedAfterSem1).reduce(
    (s, c) => s + (COURSES[c]?.credits ?? 3), 0
  );
  const remainingCreditsTotal = TOTAL_CREDITS_REQUIRED - alreadyDoneCredits;

  // Auto-upgrade target if chosen load can't finish within the expected timeline
  const minTargetForTimeline = Math.ceil(remainingCreditsTotal / Math.max(1, expectedSems));
  const neededTarget = Math.min(minTargetForTimeline, CREDIT_MAX);
  const creditTargetOverridden = rawTarget < neededTarget;
  const baseTarget = creditTargetOverridden ? neededTarget : rawTarget;

  // Number of future semesters to target (for ascending ramp)
  const targetSems = opts?.overrideSemesters ?? null;

  // ── Main scheduling loop ────────────────────────────────────────────────
  let completed = new Set(completedAfterSem1);
  let remaining = fullQueue.filter((c) => !completed.has(c));
  let semIndex = semesters.length;
  const MAX_SEMESTERS = 20;
  const firstFutureSemIdx = semIndex; // index of first unregistered semester

  while (remaining.length > 0 && semIndex < MAX_SEMESTERS) {
    const semCourses: string[] = [];
    const semRetakes: string[] = [];
    const semWarnings: string[] = [];
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
      });
      break;
    }

    // Ascending ramp: when spreading over targetSems, start light → grow heavy
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

    const highPriority = available.filter((c) => isHighPriority(c, student.concentration));
    const genEdFiller  = available.filter((c) => !isHighPriority(c, student.concentration));

    const tryAdd = (code: string) => {
      const credits = COURSES[code]?.credits ?? 3;
      if (semCredits + credits > CREDIT_MAX) return false;
      semCourses.push(code);
      semCredits += credits;
      if (retakeQueue.includes(code)) semRetakes.push(code);
      return true;
    };

    // Pass 1: fill ~2/3 of target with high-priority CS/math
    const HIGH_CAP = Math.round(semTarget * 0.67);
    for (const code of highPriority) {
      if (semCredits >= HIGH_CAP) break;
      tryAdd(code);
    }

    // Pass 2: fill to semTarget with gen-ed
    for (const code of genEdFiller) {
      if (semCredits >= semTarget) break;
      tryAdd(code);
    }

    // Pass 3: if still under target, add more high-priority
    for (const code of highPriority) {
      if (semCredits >= semTarget) break;
      if (!semCourses.includes(code)) tryAdd(code);
    }

    // Pass 4: if under minimum, add anything
    if (semCredits < CREDIT_MIN) {
      for (const code of available) {
        if (semCredits >= CREDIT_MIN) break;
        if (!semCourses.includes(code)) tryAdd(code);
      }
    }

    if (semCredits < CREDIT_MIN && available.length > 0) {
      semWarnings.push(`Only ${semCredits} credits available — may be below full-time minimum.`);
    }

    semesters.push({
      label: semesterLabel(semIndex, "Fall 2026"),
      courses: semCourses,
      totalCredits: semCredits,
      load: creditLoadLabel(semCredits),
      retakes: semRetakes,
      warnings: semWarnings,
    });

    semCourses.forEach((c) => completed.add(c));
    remaining = remaining.filter((c) => !completed.has(c));
    semIndex++;
  }

  // ── Redistribution pass: ensure last semester has ≥ CREDIT_MIN ──────────
  if (semesters.length >= 2) {
    const lastIdx = semesters.length - 1;
    const penultIdx = lastIdx - 1;

    // Build the completed set right before the penultimate semester
    const doneBeforePenult = new Set(completedAfterSem1);
    for (let si = 0; si < penultIdx; si++) {
      semesters[si].courses.forEach((c) => doneBeforePenult.add(c));
    }

    // Move courses from penultimate → last until last ≥ CREDIT_MIN
    while (semesters[lastIdx].totalCredits < CREDIT_MIN) {
      const movable = semesters[penultIdx].courses.find(
        (c) => prereqsMet(c, doneBeforePenult)
      );
      if (!movable) break;

      const cr = COURSES[movable]?.credits ?? 3;
      semesters[penultIdx].courses = semesters[penultIdx].courses.filter((c) => c !== movable);
      semesters[penultIdx].totalCredits -= cr;
      semesters[penultIdx].load = creditLoadLabel(semesters[penultIdx].totalCredits);
      semesters[lastIdx].courses.push(movable);
      semesters[lastIdx].totalCredits += cr;
      semesters[lastIdx].load = creditLoadLabel(semesters[lastIdx].totalCredits);
      // Remove the warning once we've topped up
      semesters[lastIdx].warnings = semesters[lastIdx].warnings.filter(
        (w) => !w.startsWith("Only")
      );
    }
  }

  const completedCredits = Array.from(done).concat(Array.from(registered)).reduce(
    (sum, c) => sum + (COURSES[c]?.credits ?? 3), 0
  );

  const lastSem = semesters[semesters.length - 1];
  const earlyGraduationPossible =
    remaining.length === 0 && semesters.length < expectedSems;

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
