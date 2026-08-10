import { COURSES, CREDIT_MAX } from "./data";
import { prereqsMet, type ScheduledSemester } from "./scheduler";

export type MutationResult =
  | { success: true; semesters: ScheduledSemester[]; warning?: string }
  | { success: false; reason: string };

// Courses completed through end of semIndex (inclusive) + initialDone
function completedThrough(
  semesters: ScheduledSemester[],
  upToIdx: number,
  initialDone: Set<string>
): Set<string> {
  const result = new Set(initialDone);
  for (let i = 0; i <= upToIdx && i < semesters.length; i++) {
    semesters[i].courses.forEach((c) => result.add(c));
  }
  return result;
}

export function mutMoveCourse(
  semesters: ScheduledSemester[],
  courseCode: string,
  fromSemLabel: string,
  toSemLabel: string,
  initialDone: Set<string>
): MutationResult {
  const fromIdx = semesters.findIndex((s) => s.label === fromSemLabel);
  const toIdx = semesters.findIndex((s) => s.label === toSemLabel);

  if (fromIdx === -1) return { success: false, reason: `Semester "${fromSemLabel}" not found in the plan.` };
  if (toIdx === -1) return { success: false, reason: `Semester "${toSemLabel}" not found in the plan.` };
  if (!semesters[fromIdx].courses.includes(courseCode))
    return { success: false, reason: `${courseCode} is not in ${fromSemLabel}.` };
  if (semesters[toIdx].courses.includes(courseCode))
    return { success: false, reason: `${courseCode} is already in ${toSemLabel}.` };

  const credits = COURSES[courseCode]?.credits ?? 3;

  // Remove from source temporarily
  const tempSems = semesters.map((sem, i) =>
    i === fromIdx
      ? { ...sem, courses: sem.courses.filter((c) => c !== courseCode), totalCredits: sem.totalCredits - credits }
      : sem
  );

  // Check prereqs at destination
  const prereqDone = completedThrough(tempSems, toIdx - 1, initialDone);
  if (!prereqsMet(courseCode, prereqDone)) {
    const missing = (COURSES[courseCode]?.prereqs ?? []).filter((p) => !prereqDone.has(p));
    return { success: false, reason: `Prerequisites not met for ${courseCode} in ${toSemLabel}: ${missing.join(", ")}.` };
  }

  // Credit cap at destination
  if (tempSems[toIdx].totalCredits + credits > CREDIT_MAX)
    return { success: false, reason: `Moving ${courseCode} to ${toSemLabel} would exceed the ${CREDIT_MAX}-credit maximum.` };

  // If moving later, check nothing between relies on courseCode
  if (toIdx > fromIdx) {
    for (let i = fromIdx + 1; i < toIdx; i++) {
      for (const code of tempSems[i].courses) {
        if ((COURSES[code]?.prereqs ?? []).includes(courseCode))
          return { success: false, reason: `Cannot move past ${tempSems[i].label} — ${code} in that semester depends on ${courseCode}.` };
      }
    }
  }

  const newSems = tempSems.map((sem, i) =>
    i === toIdx
      ? { ...sem, courses: [...sem.courses, courseCode], totalCredits: sem.totalCredits + credits }
      : sem
  );

  return { success: true, semesters: newSems };
}

export function mutSwapCourse(
  semesters: ScheduledSemester[],
  semLabel: string,
  removeCode: string,
  addCode: string,
  initialDone: Set<string>
): MutationResult {
  const semIdx = semesters.findIndex((s) => s.label === semLabel);
  if (semIdx === -1) return { success: false, reason: `Semester "${semLabel}" not found.` };
  if (!semesters[semIdx].courses.includes(removeCode))
    return { success: false, reason: `${removeCode} is not in ${semLabel}.` };

  const allCodes = semesters.flatMap((s) => s.courses);
  if (allCodes.includes(addCode))
    return { success: false, reason: `${addCode} is already scheduled in another semester.` };
  if (!COURSES[addCode])
    return { success: false, reason: `${addCode} is not in the course catalog.` };

  const removeCredits = COURSES[removeCode]?.credits ?? 3;
  const addCredits = COURSES[addCode]?.credits ?? 3;

  const tempSems = semesters.map((sem, i) =>
    i === semIdx
      ? { ...sem, courses: sem.courses.filter((c) => c !== removeCode), totalCredits: sem.totalCredits - removeCredits }
      : sem
  );

  const prereqDone = completedThrough(tempSems, semIdx - 1, initialDone);
  if (!prereqsMet(addCode, prereqDone)) {
    const missing = (COURSES[addCode]?.prereqs ?? []).filter((p) => !prereqDone.has(p));
    return { success: false, reason: `Prerequisites not met for ${addCode}: ${missing.join(", ")}.` };
  }

  if (tempSems[semIdx].totalCredits + addCredits > CREDIT_MAX)
    return { success: false, reason: `Adding ${addCode} would exceed the ${CREDIT_MAX}-credit maximum.` };

  const newSems = tempSems.map((sem, i) =>
    i === semIdx
      ? { ...sem, courses: [...sem.courses, addCode], totalCredits: sem.totalCredits + addCredits }
      : sem
  );

  return { success: true, semesters: newSems };
}

export function mutAddCourse(
  semesters: ScheduledSemester[],
  semLabel: string,
  courseCode: string,
  initialDone: Set<string>
): MutationResult {
  const semIdx = semesters.findIndex((s) => s.label === semLabel);
  if (semIdx === -1) return { success: false, reason: `Semester "${semLabel}" not found.` };
  if (!COURSES[courseCode])
    return { success: false, reason: `${courseCode} is not in the course catalog.` };

  const allCodes = semesters.flatMap((s) => s.courses);
  if (allCodes.includes(courseCode)) {
    const existSem = semesters.find((s) => s.courses.includes(courseCode))?.label;
    return { success: false, reason: `${courseCode} is already in your plan (${existSem}).` };
  }

  const prereqDone = completedThrough(semesters, semIdx - 1, initialDone);
  if (!prereqsMet(courseCode, prereqDone)) {
    const missing = (COURSES[courseCode]?.prereqs ?? []).filter((p) => !prereqDone.has(p));
    return { success: false, reason: `Prerequisites not met for ${courseCode}: ${missing.join(", ")}.` };
  }

  const credits = COURSES[courseCode]?.credits ?? 3;
  if (semesters[semIdx].totalCredits + credits > CREDIT_MAX)
    return { success: false, reason: `Adding ${courseCode} to ${semLabel} would exceed the ${CREDIT_MAX}-credit maximum.` };

  const newSems = semesters.map((sem, i) =>
    i === semIdx
      ? { ...sem, courses: [...sem.courses, courseCode], totalCredits: sem.totalCredits + credits }
      : sem
  );

  return { success: true, semesters: newSems };
}

export function mutRemoveCourse(
  semesters: ScheduledSemester[],
  semLabel: string,
  courseCode: string
): MutationResult {
  const semIdx = semesters.findIndex((s) => s.label === semLabel);
  if (semIdx === -1) return { success: false, reason: `Semester "${semLabel}" not found.` };
  if (!semesters[semIdx].courses.includes(courseCode))
    return { success: false, reason: `${courseCode} is not in ${semLabel}.` };

  const credits = COURSES[courseCode]?.credits ?? 3;

  const dependents: string[] = [];
  for (let i = semIdx + 1; i < semesters.length; i++) {
    for (const code of semesters[i].courses) {
      if ((COURSES[code]?.prereqs ?? []).includes(courseCode))
        dependents.push(`${code} (${semesters[i].label})`);
    }
  }

  const newSems = semesters.map((sem, i) =>
    i === semIdx
      ? { ...sem, courses: sem.courses.filter((c) => c !== courseCode), totalCredits: sem.totalCredits - credits }
      : sem
  );

  return {
    success: true,
    semesters: newSems,
    warning: dependents.length > 0
      ? `Note: ${dependents.join(", ")} depend on ${courseCode} and may have unmet prerequisites now.`
      : undefined,
  };
}
