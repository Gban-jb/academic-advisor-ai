// Single source of truth — AAMU BS Computer Science, 2025-2026 Bulletin

export type Grade =
  | "A+" | "A" | "A-"
  | "B+" | "B" | "B-"
  | "C+" | "C" | "C-"
  | "D+" | "D" | "D-"
  | "F" | "W" | "WF" | "I"
  | "TA" | "TB" | "TC"
  | "S" | "CR" | "P"
  | "REG"; // currently registered

export type Concentration = "CYB" | "AI" | "GCS";

export interface Course {
  code: string;
  title: string;
  credits: number;
  prereqs: string[]; // direct prereqs only
}

export interface TranscriptEntry {
  code: string;
  grade: Grade;
  credits: number;
  term?: string;
}

export type Classification =
  | "frosh1" | "frosh2"
  | "soph1"  | "soph2"
  | "junior1"| "junior2"
  | "senior1"| "senior2";

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  frosh1:  "Freshman (1st Semester)",
  frosh2:  "Freshman (2nd Semester)",
  soph1:   "Sophomore (1st Semester)",
  soph2:   "Sophomore (2nd Semester)",
  junior1: "Junior (1st Semester)",
  junior2: "Junior (2nd Semester)",
  senior1: "Senior (1st Semester)",
  senior2: "Senior (2nd Semester)",
};

// Semesters remaining INCLUDING the current one
export const EXPECTED_SEMESTERS: Record<Classification, number> = {
  frosh1:  8,
  frosh2:  7,
  soph1:   6,
  soph2:   5,
  junior1: 4,
  junior2: 3,
  senior1: 2,
  senior2: 1,
};

export interface StudentData {
  name: string;
  id: string;
  gpa: number;
  concentration: Concentration;
  transcript: TranscriptEntry[];
  classification: Classification;
  creditTarget: 12 | 15 | 18;
  earlyGraduation?: boolean;           // undefined = not yet decided
  interestCourses?: string[];          // user-selected electives for filler padding
  extensionCreditTarget?: 12 | 15 | 18; // credits per extension semester (spread-out mode, default 12)
}

// Normalize course code: "CS102" → "CS 102"
export function norm(code: string): string {
  return code.trim().replace(/([A-Z]+)(\d)/, "$1 $2").toUpperCase();
}

// ─── Grade Logic ───────────────────────────────────────────────────────────────

export function gradeIsPassing(grade: Grade): boolean {
  return ["A+","A","A-","B+","B","B-","C+","C","C-","TA","TB","TC","S","CR","P"].includes(grade);
}

export function gradeIsRegistered(grade: Grade): boolean {
  return grade === "REG";
}

// ─── Course Database ──────────────────────────────────────────────────────────

export const COURSES: Record<string, Course> = {
  // ── Computer Science ──
  // Prerequisites are taken verbatim from the official AAMU 2025-2026
  // Undergraduate Bulletin course descriptions. Notes:
  //  - "Junior/Senior standing" requirements are not course prerequisites,
  //    so they are omitted here (the scheduler spaces courses out by credit
  //    load); they are documented in comments below.
  //  - "A or B" prerequisites: the AAMU CS plan always requires the more
  //    common course (e.g. CS 109), so we list that one; the future rules
  //    engine will model true OR groups.
  // Required spine (Bulletin p.199)
  "CS 102": { code: "CS 102", title: "Intro to Programming I", credits: 3, prereqs: [] },
  "CS 104": { code: "CS 104", title: "Intro to Computers & Ethics", credits: 3, prereqs: [] },
  "CS 109": { code: "CS 109", title: "Intro to Programming II", credits: 3, prereqs: ["CS 102"] },
  "CS 203": { code: "CS 203", title: "Discrete Structures", credits: 3, prereqs: ["CS 102"] },
  "CS 206": { code: "CS 206", title: "Intro Java Programming I", credits: 3, prereqs: ["CS 102"] },
  "CS 209": { code: "CS 209", title: "Intro to Digital Logic Design", credits: 3, prereqs: ["CS 203"] },
  "CS 215": { code: "CS 215", title: "Data Structures", credits: 3, prereqs: ["CS 109"] }, // CS 109 or EE 109
  "CS 314": { code: "CS 314", title: "Advanced Programming", credits: 3, prereqs: ["CS 109", "CS 206"] },
  "CS 401": { code: "CS 401", title: "Software Engineering", credits: 3, prereqs: ["CS 215", "CS 314"] }, // + senior standing
  "CS 403": { code: "CS 403", title: "Senior Problems (Capstone)", credits: 3, prereqs: ["CS 401"] },
  "CS 405": { code: "CS 405", title: "Linux w/ Application Programming", credits: 3, prereqs: ["CS 314", "CS 384"] },
  "CS 410": { code: "CS 410", title: "Seminar", credits: 3, prereqs: ["CS 314", "CS 381"] },
  "CS 425": { code: "CS 425", title: "Theory of Algorithms", credits: 3, prereqs: ["CS 215", "MTH 126"] },
  // Concentration core (shared by all concentrations)
  "CS 381": { code: "CS 381", title: "Computer Organization", credits: 3, prereqs: ["CS 209"] },
  "CS 384": { code: "CS 384", title: "Operating Systems", credits: 3, prereqs: ["CS 209", "CS 215"] }, // + junior standing
  "CS 488": { code: "CS 488", title: "Database Systems", credits: 3, prereqs: ["CS 215"] },
  // General Computer Science electives (Bulletin p.205)
  "CS 303": { code: "CS 303", title: "Assembly Language", credits: 3, prereqs: ["CS 109", "CS 203"] },
  "CS 304": { code: "CS 304", title: "Intro to Web Programming", credits: 3, prereqs: [] }, // junior standing
  "CS 306": { code: "CS 306", title: "Intro Java Programming II", credits: 3, prereqs: ["CS 206"] },
  "CS 309": { code: "CS 309", title: "Computer Graphics", credits: 3, prereqs: ["CS 215", "MTH 237"] },
  "CS 311": { code: "CS 311", title: "Intro to Simulation", credits: 3, prereqs: ["CS 215"] },
  "CS 315": { code: "CS 315", title: "Intro to Game Programming", credits: 3, prereqs: ["CS 215"] },
  "CS 320": { code: "CS 320", title: "Intro to Multimedia Authoring", credits: 3, prereqs: [] }, // junior standing
  "CS 321": { code: "CS 321", title: "Principles of Information Security", credits: 3, prereqs: ["CS 104"] },
  "CS 328": { code: "CS 328", title: "Object Oriented Design with UML", credits: 3, prereqs: ["CS 109"] }, // CS 109 or CS 206
  "CS 330": { code: "CS 330", title: "Computers in Society", credits: 3, prereqs: ["CS 104"] },
  "CS 386": { code: "CS 386", title: "Cryptography", credits: 3, prereqs: ["CS 203", "CS 215"] },
  "CS 389": { code: "CS 389", title: "Programming in Robotics Systems", credits: 3, prereqs: ["CS 109"] }, // CS 109 or CS 206
  "CS 408": { code: "CS 408", title: "Wireless Computing", credits: 3, prereqs: ["CS 384"] },
  "CS 409": { code: "CS 409", title: "Intro to Digital Image Processing", credits: 3, prereqs: ["CS 215"] }, // + senior standing
  "CS 413": { code: "CS 413", title: "Data Science", credits: 3, prereqs: ["CS 215"] }, // + senior standing
  "CS 414": { code: "CS 414", title: "Forensic Computing", credits: 3, prereqs: ["CS 384"] },
  "CS 421": { code: "CS 421", title: "Computer Security", credits: 3, prereqs: ["CS 384"] },
  "CS 430": { code: "CS 430", title: "Machine Learning", credits: 3, prereqs: ["CS 215", "MTH 237"] }, // coreq MTH 453
  "CS 435": { code: "CS 435", title: "Intro to Bioinformatics", credits: 3, prereqs: [] }, // senior standing or consent
  "CS 440": { code: "CS 440", title: "Programming Languages", credits: 3, prereqs: ["CS 314"] },
  "CS 450": { code: "CS 450", title: "Artificial Intelligence", credits: 3, prereqs: ["CS 215"] },
  "CS 483": { code: "CS 483", title: "Compilers", credits: 3, prereqs: ["CS 215"] }, // + senior standing
  "CS 484": { code: "CS 484", title: "Internship", credits: 3, prereqs: ["CS 314"] },
  "CS 485": { code: "CS 485", title: "Intro to Data Comm. & Networks", credits: 3, prereqs: ["CS 381"] },
  "CS 490": { code: "CS 490", title: "High Performance Computing", credits: 3, prereqs: ["CS 215", "CS 381"] },
  // GenEd / Math / Physics
  "ENG 101": { code: "ENG 101", title: "Composition I", credits: 3, prereqs: [] },
  "ENG 102": { code: "ENG 102", title: "Composition II", credits: 3, prereqs: ["ENG 101"] },
  "ENG 201": { code: "ENG 201", title: "World Literature I", credits: 3, prereqs: [] },
  "ENG 202": { code: "ENG 202", title: "Survey of English Literature", credits: 3, prereqs: [] },
  "ENG 203": { code: "ENG 203", title: "American Literature I", credits: 3, prereqs: [] },
  "ENG 204": { code: "ENG 204", title: "American Literature II", credits: 3, prereqs: [] },
  "ENG 207": { code: "ENG 207", title: "World Literature I (Alt)", credits: 3, prereqs: [] },
  "ENG 208": { code: "ENG 208", title: "World Literature II (Alt)", credits: 3, prereqs: [] },
  "MTH 125": { code: "MTH 125", title: "Calculus I", credits: 4, prereqs: [] },
  "MTH 126": { code: "MTH 126", title: "Calculus II", credits: 4, prereqs: ["MTH 125"] },
  "MTH 111": { code: "MTH 111", title: "Elementary Statistics I", credits: 3, prereqs: [] },
  "MTH 227": { code: "MTH 227", title: "Calculus III", credits: 4, prereqs: ["MTH 126"] },
  "MTH 237": { code: "MTH 237", title: "Linear Algebra", credits: 3, prereqs: ["MTH 126"] },
  "MTH 453": { code: "MTH 453", title: "Probability & Statistics", credits: 3, prereqs: ["MTH 126"] },

  // ── Additional MTH courses — Mathematics major (Bulletin p.294-298) ──
  // Extracted for the upcoming Mathematics interactive planner. Safe to
  // include now: CS students taking math electives can also reference these.
  "MTH 238": { code: "MTH 238", title: "Applied Differential Equations", credits: 3, prereqs: ["MTH 126"] },
  "MTH 301": { code: "MTH 301", title: "Abstract Algebra I", credits: 3, prereqs: ["MTH 237"] },
  "MTH 302": { code: "MTH 302", title: "Abstract Algebra II", credits: 3, prereqs: ["MTH 301"] },
  "MTH 303": { code: "MTH 303", title: "Methods of Mathematical Physics", credits: 4, prereqs: ["MTH 227"] },
  "MTH 324": { code: "MTH 324", title: "Elementary Statistics II", credits: 3, prereqs: ["MTH 111"] }, // or MTH 112 w/ MinC
  "MTH 327": { code: "MTH 327", title: "Applied Regression Analysis", credits: 3, prereqs: ["MTH 324", "MTH 125"] },
  "MTH 344": { code: "MTH 344", title: "Design and Analysis of Experiments", credits: 3, prereqs: ["MTH 327"] },
  "MTH 351": { code: "MTH 351", title: "Intro to Real Analysis I", credits: 3, prereqs: ["MTH 227"] },
  "MTH 352": { code: "MTH 352", title: "Intro to Real Analysis II", credits: 3, prereqs: ["MTH 351"] },
  "MTH 371": { code: "MTH 371", title: "Number Theory", credits: 3, prereqs: ["MTH 237"] },
  "MTH 383": { code: "MTH 383", title: "Numerical Analysis", credits: 3, prereqs: ["MTH 227", "CS 102"] },
  "MTH 431": { code: "MTH 431", title: "Introduction to Graph Theory", credits: 3, prereqs: ["MTH 126"] },
  "MTH 442": { code: "MTH 442", title: "Partial Differential Equations", credits: 3, prereqs: ["MTH 238"] },
  "MTH 444": { code: "MTH 444", title: "Applied Time Series Analysis", credits: 3, prereqs: ["MTH 324"] },
  "MTH 452": { code: "MTH 452", title: "Complex Analysis", credits: 3, prereqs: ["MTH 227"] },
  "MTH 454": { code: "MTH 454", title: "Advanced Calculus", credits: 3, prereqs: ["MTH 227"] },
  "MTH 473": { code: "MTH 473", title: "Statistics", credits: 3, prereqs: ["MTH 453"] },
  "MTH 480": { code: "MTH 480", title: "Selected Topics in Mathematics", credits: 3, prereqs: ["MTH 301"] }, // or MTH 351
  "MTH 481": { code: "MTH 481", title: "Senior Project (Math capstone)", credits: 3, prereqs: ["MTH 301"] }, // or MTH 351
  "PHY 213": { code: "PHY 213", title: "General Physics with Calculus I", credits: 4, prereqs: ["MTH 125"] },
  "PHY 214": { code: "PHY 214", title: "General Physics with Calculus II", credits: 4, prereqs: ["PHY 213", "MTH 126"] },
  "ORI 101": { code: "ORI 101", title: "First Year Experience", credits: 1, prereqs: [] },
  "ORI 102": { code: "ORI 102", title: "Second Year Experience", credits: 1, prereqs: [] },
  "HED 101": { code: "HED 101", title: "Personal & Community Health", credits: 2, prereqs: [] },
  "ECO 231": { code: "ECO 231", title: "Principles of Macroeconomics", credits: 3, prereqs: [] },
  "ECO 230": { code: "ECO 230", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
  "MUS 101": { code: "MUS 101", title: "Music Appreciation", credits: 3, prereqs: [] },
  "ART 101": { code: "ART 101", title: "Art Appreciation", credits: 3, prereqs: [] },
  "COMM 101": { code: "COMM 101", title: "Public Speaking", credits: 3, prereqs: [] },
  "PHL 201": { code: "PHL 201", title: "Introduction to Philosophy", credits: 3, prereqs: [] },
  "PHL 203": { code: "PHL 203", title: "Ethics", credits: 3, prereqs: [] },
  "PSY 201": { code: "PSY 201", title: "General Psychology", credits: 3, prereqs: [] },
  "SOC 201": { code: "SOC 201", title: "Introduction to Sociology", credits: 3, prereqs: [] },
  "SOC 210": { code: "SOC 210", title: "Sociology of Race", credits: 3, prereqs: [] },
  "HIS 101": { code: "HIS 101", title: "World History I", credits: 3, prereqs: [] },
  "HIS 102": { code: "HIS 102", title: "World History II", credits: 3, prereqs: [] },
  "HIS 201": { code: "HIS 201", title: "American History I", credits: 3, prereqs: [] },
  "HIS 202": { code: "HIS 202", title: "American History II", credits: 3, prereqs: [] },
  "GEO 213": { code: "GEO 213", title: "Physical Geography", credits: 3, prereqs: [] },
  "UPL 103": { code: "UPL 103", title: "Urban Planning", credits: 3, prereqs: [] },
  "SPA 101": { code: "SPA 101", title: "Spanish I", credits: 3, prereqs: [] },
  "FRE 101": { code: "FRE 101", title: "French I", credits: 3, prereqs: [] },
};

// ─── Degree Requirements ──────────────────────────────────────────────────────

export const CS_MAJOR_REQUIRED: string[] = [
  "CS 102", "CS 104", "CS 109", "CS 203", "CS 206", "CS 209",
  "CS 215", "CS 314", "CS 401", "CS 403", "CS 405", "CS 410", "CS 425",
  "CS 484",
];

export const CONCENTRATION_COURSES: Record<Concentration, string[]> = {
  CYB: ["CS 381", "CS 384", "CS 488", "CS 321", "CS 386", "CS 414", "CS 421"],
  AI:  ["CS 381", "CS 384", "CS 488", "CS 389", "CS 409", "CS 430", "CS 450"],
  // 3 required + 4 program electives (2 at 300-level, 2 at 400-level per bulletin)
  GCS: ["CS 381", "CS 384", "CS 488", "CS 303", "CS 304", "CS 440", "CS 485"],
};

export const CORE_CMP: string[] = ["MTH 237", "MTH 453"];

// Program electives (can be satisfied by transfer)
export const PROGRAM_ELECTIVES: string[] = ["MTH 111", "MTH 227"];

// Free electives — CS 330 and CS 311 live only in FILLER_POOL (used to hit 12-cr min
// per semester); CS 484 moved to CS_MAJOR_REQUIRED. Keeping this array for future use.
export const FREE_ELECTIVES: string[] = [];

// ─── Mathematics major requirements (Bulletin p.214) ─────────────────────────
// Ready for the Mathematics interactive planner once the wizard is refactored
// to be program-driven. Total: 120 credit hours.

/** Fixed MTH courses every Math major takes. */
export const MATH_MAJOR_REQUIRED: string[] = [
  "MTH 125", "MTH 126", "MTH 227", "MTH 237", "MTH 238",
  "MTH 301", "MTH 351", "MTH 453", "MTH 481", // MTH 481 is the capstone
];

/**
 * Approved MTH Major Electives (Bulletin p.214, footnote 5).
 * Students pick 2 electives (6 credits) beyond the required list.
 */
export const MATH_MAJOR_ELECTIVES: string[] = [
  "MTH 302", "MTH 303", "MTH 324", "MTH 327", "MTH 344",
  "MTH 352", "MTH 371", "MTH 383", "MTH 444", "MTH 452",
  "MTH 473", "MTH 480",
];

/** Programming course requirement for Math majors (any one of these). */
export const MATH_PROGRAMMING_OPTIONS: string[] = ["CS 102", "EE 109"]; // EGC 104, ME 104 also acceptable per bulletin

// Fixed GenEd (always required)
export const GENED_FIXED: string[] = [
  "ENG 101", "ENG 102", "PHY 213", "PHY 214",
  "MTH 125", "MTH 126", "ORI 101", "ORI 102",
  "HED 101", "ECO 231", "CS 104",
];

// GenEd choice groups — student must fulfill each group
export interface GenEdGroup {
  id: string;
  label: string;
  creditsNeeded: number;
  options: string[][]; // each inner array = one valid selection
}

export const GENED_GROUPS: GenEdGroup[] = [
  {
    id: "literature",
    label: "Literature Sequence",
    creditsNeeded: 3,
    options: [["ENG 202"], ["ENG 201"], ["ENG 203", "ENG 204"], ["ENG 207", "ENG 208"]],
  },
  {
    id: "finearts",
    label: "Fine Arts / Language",
    creditsNeeded: 3,
    options: [
      ["ART 101"], ["MUS 101"], ["COMM 101"], ["PHL 201"], ["PHL 203"],
      ["SPA 101"], ["FRE 101"], ["ENG 201"], ["ENG 202"],
    ],
  },
  {
    id: "history",
    label: "History (2 classes)",
    creditsNeeded: 6,
    options: [
      ["HIS 101", "HIS 102"], ["HIS 101", "HIS 201"], ["HIS 101", "HIS 202"],
      ["HIS 102", "HIS 201"], ["HIS 102", "HIS 202"], ["HIS 201", "HIS 202"],
    ],
  },
  {
    id: "socialscience",
    label: "Social / Behavioral Science",
    creditsNeeded: 3,
    options: [["SOC 201"], ["SOC 210"], ["GEO 213"], ["PSY 201"], ["UPL 103"]],
  },
];

export const TOTAL_CREDITS_REQUIRED = 125;
export const MIN_RESIDENCE_CREDITS = 20;
export const CREDIT_MIN = 12;
export const CREDIT_TARGET = 15;
export const CREDIT_MAX = 18;

// Courses eligible as filler to pad short semesters to ≥ 12 credits.
// Ordered: culturally enriching first, CS electives last.
// buildFillerPool() in scheduler.ts filters this against completed + remaining.
export const FILLER_POOL: string[] = [
  "MUS 101", "ART 101", "COMM 101", "PHL 201", "PHL 203",
  "SPA 101", "FRE 101",
  "PSY 201", "SOC 201", "SOC 210", "GEO 213", "UPL 103",
  "HIS 101", "HIS 102", "HIS 201", "HIS 202",
  "ENG 201", "ENG 202", "ENG 203", "ENG 204", "ENG 207", "ENG 208",
  "ECO 230",
  "CS 304", "CS 320", "CS 330", "CS 311", "CS 315", "CS 328", "CS 435",
];

// ─── Empty starting student ──────────────────────────────────────────────────
// The planner begins blank — students upload a transcript or add courses manually.

// Standard first-semester courses for an incoming freshman (all have no prereqs).
// PHY 213 is NOT here — it requires completed MTH 125, so it belongs in sem 2.
export const YEAR1_SEM1_COURSES: TranscriptEntry[] = [
  { code: "CS 102",  grade: "REG", credits: 3 },
  { code: "ENG 101", grade: "REG", credits: 3 },
  { code: "MTH 125", grade: "REG", credits: 4 },
  { code: "ORI 101", grade: "REG", credits: 1 },
  { code: "HED 101", grade: "REG", credits: 2 },
]; // 13 credits total

export const EMPTY_STUDENT: StudentData = {
  name: "",
  id: "",
  gpa: 0,
  concentration: "AI",
  transcript: [],
  classification: "frosh1",
  creditTarget: 15,
};
