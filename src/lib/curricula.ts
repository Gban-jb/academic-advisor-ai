/**
 * Per-major sample 4-year graduation plans, transcribed from the AAMU
 * Undergraduate Bulletin 2026-2027.
 *
 * These are the bulletin's recommended sequences — the same tables an advisor
 * would print off. They are prereq-valid by construction, which is why they
 * work as a self-contained view without the full prereq-aware scheduler that
 * powers the CS planner. When we add full course/prereq data for a major, its
 * interactive planner becomes possible; until then, this is what a student
 * actually needs.
 *
 * Numbered footnote conventions used throughout the bulletin, kept here:
 *   ¹ See General Education Requirements — student picks from the GenEd list
 *   ² MinGrade of C required
 *   [CS] Capstone course; cannot be substituted
 */

export interface CoursePick {
  /** Course code where the bulletin specifies one — e.g. "MTH 125". */
  code?: string;
  /** Text that appears in the plan; sometimes a placeholder like "Fine Arts – See GenEd Listing". */
  title: string;
  credits: number;
  /** Bulletin ² footnote — a C is required to progress. */
  minC?: boolean;
  /** [CS] capstone marker. */
  capstone?: boolean;
  /** Free-text note (elective type, "or…" alternatives, credit range, etc.). */
  note?: string;
}

export interface Semester {
  label: "First Semester" | "Second Semester";
  courses: CoursePick[];
  /** Total from the bulletin table; kept explicit so any transcription mistake is loud. */
  credits: number;
  /** Bulletin credit range where the total isn't fixed. */
  creditsRange?: [number, number];
}

export interface Year {
  label: "Freshman Year" | "Sophomore Year" | "Junior Year" | "Senior Year";
  semesters: [Semester, Semester];
}

export interface Concentration {
  slug: string;
  name: string;
  totalCredits: string;
  courses: CoursePick[];
}

export interface Curriculum {
  /** Matches majorSlug() in careers.ts. */
  slug: string;
  major: string;
  /** e.g. "120", "125 or 131 (5-yr program)". */
  totalCredits: string;
  years: [Year, Year, Year, Year];
  /** Free-text footnotes rendered under the plan. */
  notes: string[];
  /** Optional named concentrations. */
  concentrations?: Concentration[];
  /** The bulletin page this was transcribed from, for auditability. */
  bulletinPage: number;
}

const GENED = "See GenEd Listing";

/**
 * MATHEMATICS — 120 Credit Hours — Bulletin p.214
 */
const MATHEMATICS: Curriculum = {
  slug: "mathematics",
  major: "Mathematics",
  totalCredits: "120",
  bulletinPage: 214,
  years: [
    {
      label: "Freshman Year",
      semesters: [
        {
          label: "First Semester",
          credits: 17,
          courses: [
            { code: "ORI 101", title: "First Year Experience", credits: 1 },
            { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
            { code: "MTH 125", title: "Calculus I", credits: 4 },
            { title: `Sci lecture – ${GENED}`, credits: 3 },
            { title: `Sci lab – ${GENED}`, credits: 1 },
            { title: `History – ${GENED}`, credits: 3 },
            { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
          ],
        },
        {
          label: "Second Semester",
          credits: 15,
          courses: [
            { code: "ORI 102", title: "First Year Experience", credits: 1 },
            { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
            { title: `Fine Arts – ${GENED}`, credits: 3 },
            { title: `Sci lecture – ${GENED}`, credits: 3 },
            { title: `Sci lab – ${GENED}`, credits: 1 },
            { code: "MTH 126", title: "Calculus II", credits: 4, minC: true },
          ],
        },
      ],
    },
    {
      label: "Sophomore Year",
      semesters: [
        {
          label: "First Semester",
          credits: 16,
          courses: [
            { title: `Literature – ${GENED}`, credits: 3 },
            { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
            { title: `Economics – ${GENED}`, credits: 3 },
            { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
            { code: "MTH 227", title: "Calculus III", credits: 4, minC: true },
          ],
        },
        {
          label: "Second Semester",
          credits: 15,
          courses: [
            { code: "CS 102", title: "Intro to Programming", credits: 3, note: "EE 109, EGC 104, ME 104 also acceptable" },
            { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
            { code: "MTH 237", title: "Intro to Linear Algebra", credits: 3, minC: true },
            { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
            { code: "MTH 238", title: "Applied Differential Equations", credits: 3, minC: true },
          ],
        },
      ],
    },
    {
      label: "Junior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 12,
          courses: [
            { code: "MTH 301", title: "Abstract Algebra I", credits: 3, minC: true },
            { code: "MTH 351", title: "Intro to Real Analysis I", credits: 3, minC: true },
            { title: "Minor OR 2nd Major course", credits: 3 },
            { title: "Minor OR 2nd Major course", credits: 3 },
          ],
        },
        {
          label: "Second Semester",
          credits: 15,
          courses: [
            { title: "Free Elective", credits: 3 },
            { title: "MTH Major Elective", credits: 3, minC: true, note: "See footnote for eligible list" },
            { title: "Minor OR 2nd Major course", credits: 3 },
            { title: "Minor OR 2nd Major course", credits: 3 },
            { title: "Free Elective", credits: 3 },
          ],
        },
      ],
    },
    {
      label: "Senior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 15,
          creditsRange: [12, 15],
          courses: [
            { title: "MTH Major Elective", credits: 3, minC: true },
            { code: "MTH 453", title: "Probability & Statistics", credits: 3, minC: true, note: "or ST 453" },
            { title: "Minor OR 2nd Major course", credits: 3 },
            { title: "Free Elective", credits: 3 },
            { title: "2nd Major course OR MTH Major Elective", credits: 3, note: "0–3 credits — 3 when a minor is attached (bulletin footnote)" },
          ],
        },
        {
          label: "Second Semester",
          credits: 15,
          creditsRange: [12, 15],
          courses: [
            { title: "Free Elective", credits: 3 },
            { code: "MTH 481", title: "Senior Project", credits: 3, minC: true, capstone: true },
            { title: "Minor OR 2nd Major course", credits: 3 },
            { title: "Free Elective", credits: 3 },
            { title: "2nd Major course OR MTH Major Elective", credits: 3, note: "0–3 credits — 3 when a minor is attached (bulletin footnote)" },
          ],
        },
      ],
    },
  ],
  notes: [
    "Math Major Electives: MTH 302, (MTH 303 or PHY 303), (MTH 324 or ST 324), (MTH 327 or ST 327), (MTH 344 or ST 344), 352, 371, 383, (MTH 444 or ST 444), 452, (MTH 473 or ST 473), 480.",
    "If Attached Minor is chosen, take 12 credits of MTH Major Electives instead of 2nd Major courses. Recommended minors: Applied Statistics, Biology, Business, Chemistry, Computer Science, Physics.",
    "If a Literature sequence is chosen, the second literature slot goes to Hum/Fine Arts. If a History sequence is chosen, the second history slot goes to Social/Behavioral Science.",
    "Mathematics majors must pass a mid-level program examination near the end of the sophomore year (see Bulletin p.212, item 15).",
    "Successful completion of the Senior Project (MTH 481) is required.",
  ],
};

/**
 * PHYSICS — 121 Credit Hours — Bulletin p.215
 */
const PHYSICS: Curriculum = {
  slug: "physics",
  major: "Physics",
  totalCredits: "121",
  bulletinPage: 215,
  years: [
    {
      label: "Freshman Year",
      semesters: [
        {
          label: "First Semester",
          credits: 15,
          courses: [
            { code: "ORI 101", title: "First Year Experience", credits: 1 },
            { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
            { code: "MTH 125", title: "Calculus I", credits: 4 },
            { title: `History – ${GENED}`, credits: 3 },
            { code: "PHY 213", title: "General Physics with Calculus I", credits: 4, minC: true },
          ],
        },
        {
          label: "Second Semester",
          credits: 18,
          courses: [
            { code: "ORI 102", title: "First Year Experience", credits: 1 },
            { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
            { code: "MTH 126", title: "Calculus II", credits: 4, minC: true },
            { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
            { code: "PHY 214", title: "General Physics with Calculus II", credits: 4, minC: true },
            { title: `History – ${GENED}`, credits: 3 },
          ],
        },
      ],
    },
    {
      label: "Sophomore Year",
      semesters: [
        {
          label: "First Semester",
          credits: 16,
          courses: [
            { title: `Literature – ${GENED}`, credits: 3 },
            { title: `Economics – ${GENED}`, credits: 3 },
            { code: "CS 102", title: "Intro to Programming", credits: 3 },
            { title: `Fine Arts – ${GENED}`, credits: 3 },
            { code: "MTH 227", title: "Calculus III", credits: 4, minC: true },
          ],
        },
        {
          label: "Second Semester",
          credits: 17,
          courses: [
            { code: "HED 101", title: "Personal & Community Health", credits: 2, note: "or PED / MSC 101" },
            { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
            { code: "PHY 218", title: "Modern Physics", credits: 3, minC: true },
            { code: "PHY 252L", title: "Modern Physics Lab", credits: 3, minC: true },
            { title: "Free Elective", credits: 3 },
            { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
          ],
        },
      ],
    },
    {
      label: "Junior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 16,
          courses: [
            { code: "MTH 238", title: "Applied Differential Equations", credits: 3, minC: true },
            { code: "PHY 303", title: "Methods of Math Physics", credits: 4, minC: true, note: "MTH 303 also acceptable" },
            { code: "PHY 321", title: "Mechanics I", credits: 3, minC: true },
            { title: "Free Elective", credits: 3 },
            { title: "Free Elective", credits: 3 },
          ],
        },
        {
          label: "Second Semester",
          credits: 15,
          courses: [
            { code: "CS 109", title: "Intro to Programming II", credits: 3, minC: true },
            { code: "PHY 322", title: "Mechanics II", credits: 3, minC: true },
            { code: "PHY 331", title: "Electricity & Magnetism I", credits: 3, minC: true },
            { code: "PHY 341", title: "Heat and Thermodynamics", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true, note: "PHY, MTH, CHE, BIO, EGC, EE, ME, CE or CS" },
          ],
        },
      ],
    },
    {
      label: "Senior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 12,
          courses: [
            { code: "PHY 401", title: "Optics", credits: 3, minC: true },
            { code: "PHY 421", title: "Intro to Quantum Mechanics", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true },
          ],
        },
        {
          label: "Second Semester",
          credits: 12,
          courses: [
            { code: "PHY 451", title: "Intro to Solid State Physics", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, minC: true },
          ],
        },
      ],
    },
  ],
  notes: [
    "Restricted electives must be from PHY, MTH, CHE, BIO, EGC, EE, ME, CE or CS.",
    "If the MTH minor is chosen, 11 hours of MTH Electives replace MTH 126/227/238. See Physics 'Minors, Concentrations & Electives' in the Bulletin.",
    "A grade of C or better is required in physics, chemistry and mathematics courses (Bulletin p.212, item 8).",
  ],
};

/**
 * ELECTRICAL ENGINEERING — 130 Credit Hours — Bulletin p.204-206
 */
const ELECTRICAL_ENGINEERING: Curriculum = {
  slug: "electrical-engineering",
  major: "Electrical Engineering",
  totalCredits: "130",
  bulletinPage: 204,
  years: [
    {
      label: "Freshman Year",
      semesters: [
        {
          label: "First Semester",
          credits: 17,
          courses: [
            { code: "ORI 101", title: "First Year Experience", credits: 1 },
            { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
            { code: "MTH 125", title: "Calculus I", credits: 4 },
            { code: "CHE 101", title: "General Chemistry I", credits: 3 },
            { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
            { code: "EE 101", title: "Intro to Electrical Engineering", credits: 2, minC: true },
            { title: "PED / MSC / HED Elective", credits: 3 },
          ],
        },
        {
          label: "Second Semester",
          credits: 18,
          courses: [
            { code: "ORI 102", title: "First Year Experience", credits: 1 },
            { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
            { code: "MTH 126", title: "Calculus II", credits: 4, minC: true },
            { code: "PHY 213", title: "General Physics with Calculus I", credits: 4 },
            { code: "EE 109", title: "Engineering Computing", credits: 3, minC: true },
            { title: `History Sequence – ${GENED}`, credits: 3 },
          ],
        },
      ],
    },
    {
      label: "Sophomore Year",
      semesters: [
        {
          label: "First Semester",
          credits: 18,
          courses: [
            { title: `History Sequence – ${GENED}`, credits: 3 },
            { code: "MTH 227", title: "Calculus III", credits: 4, minC: true },
            { code: "PHY 214", title: "General Physics with Calculus II", credits: 4 },
            { code: "EE 201", title: "Linear Circuit Analysis I", credits: 3, minC: true },
            { code: "EE 201L", title: "Linear Circuit Analysis I Lab", credits: 1, minC: true },
            { title: `Fine Arts – ${GENED}`, credits: 3 },
          ],
        },
        {
          label: "Second Semester",
          credits: 16,
          courses: [
            { title: `Literature – ${GENED}`, credits: 3 },
            { code: "MTH 238", title: "Applied Differential Equations", credits: 3 },
            { code: "EE 202", title: "Linear Circuit Analysis II", credits: 3, minC: true },
            { code: "EE 203", title: "Analog Circuit Design/Analysis I", credits: 3, minC: true },
            { code: "EE 203L", title: "Analog Circuit Design/Analysis I Lab", credits: 1, minC: true },
            { code: "EE 204", title: "Digital Circuit Design/Analysis", credits: 3, minC: true },
          ],
        },
      ],
    },
    {
      label: "Junior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 16,
          courses: [
            { code: "EE 301", title: "Signals & Systems I", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3, note: "EE 303/305/306/307/308/404 or ME 2xx (not 481) or CE 2xx" },
            { code: "EE 320", title: "Computer Architecture", credits: 3, minC: true },
            { code: "EE 320L", title: "Digital Systems Lab", credits: 1, minC: true },
            { code: "EE 333", title: "Analog Circuit Design/Analysis II", credits: 3, minC: true },
            { title: `Economics – ${GENED}`, credits: 3 },
          ],
        },
        {
          label: "Second Semester",
          credits: 18,
          courses: [
            { title: "Concentration Course", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3 },
            { code: "EE 304", title: "Numerical Methods/Digital Computing", credits: 3, minC: true },
            { code: "EE 330", title: "Microprocessors", credits: 3, minC: true },
            { title: "Concentration Course", credits: 3, minC: true },
            { title: "Restricted Elective", credits: 3 },
          ],
        },
      ],
    },
    {
      label: "Senior Year",
      semesters: [
        {
          label: "First Semester",
          credits: 15,
          courses: [
            { title: "Concentration Lab Course", credits: 3, minC: true },
            { code: "EE 403", title: "Feedback System Analysis/Design", credits: 3, minC: true },
            { title: "Concentration Course", credits: 3, minC: true, note: "or eligible 5xx-6xx graduate course (5-yr program)" },
            { title: `Humanities – ${GENED}`, credits: 3 },
            { title: "Concentration Course", credits: 3, minC: true, note: "or eligible 5xx-6xx graduate course (5-yr program)" },
          ],
        },
        {
          label: "Second Semester",
          credits: 12,
          courses: [
            { title: "Concentration Course", credits: 3, minC: true, note: "or eligible 5xx-6xx graduate course (5-yr program)" },
            { title: "Restricted Elective", credits: 3 },
            { title: "Concentration Course", credits: 3, minC: true },
            { title: "MTH 237, 303, 452, MTH 453 or ST 453, PHY 303", credits: 3 },
          ],
        },
      ],
    },
  ],
  concentrations: [
    {
      slug: "microelectronic-vlsi",
      name: "Microelectronic-VLSI (VLSI)",
      totalCredits: "21 (+12 with restricted electives = 33)",
      courses: [
        { code: "EE 303", title: "Electromagnetic Field Theory", credits: 3 },
        { code: "EE 305", title: "Semiconductor Engineering I", credits: 3 },
        { code: "EE 340L", title: "or EE 360L", credits: 1 },
        { code: "EE 350", title: "VLSI Design & Testing", credits: 3 },
        { code: "EE 404", title: "Communication Theory", credits: 3 },
        { code: "EE 431", title: "Semiconductor Engineering II", credits: 3, note: "or EE 531 in 5-yr program" },
        { code: "EE 451", title: "Integrated Circuit Fabrication", credits: 3, note: "or EE 551 in 5-yr program" },
        { code: "EE 451L", title: "Integrated Circuit Fab Lab", credits: 1 },
        { code: "EE 470", title: "Engineering Analysis & Design I", credits: 2, capstone: true },
        { code: "EE 471", title: "Engineering Analysis & Design II", credits: 2, capstone: true },
        { title: "EE 4xx (not already required)", credits: 3, note: "or EE 5xx-6xx in 5-yr program" },
        { code: "ME 481", title: "Quality & Reliability Assurance", credits: 3 },
      ],
    },
    {
      slug: "computer-engineering",
      name: "Computer Engineering (CME)",
      totalCredits: "21 (+12 with restricted electives = 33)",
      courses: [
        { code: "CS 215", title: "Data Structures", credits: 3 },
        { code: "CS 384", title: "Operating Systems", credits: 3 },
        { title: "CS 4xx (not already required)", credits: 3, note: "or CS 5xx-6xx in 5-yr program" },
        { code: "EE 303", title: "Electromagnetic Field Theory", credits: 3 },
        { code: "EE 305", title: "Semiconductor Engineering I", credits: 3 },
        { code: "EE 340L", title: "or EE 360L", credits: 1 },
        { title: "EE 350 or EE 4xx (not already required)", credits: 3, note: "or EE 5xx-6xx in 5-yr program" },
        { code: "EE 404", title: "Communication Theory", credits: 3, note: "or EE 504 in 5-yr program" },
        { code: "EE 405L", title: "Simulation Techniques", credits: 1 },
        { code: "EE 470", title: "Engineering Analysis & Design I", credits: 2, capstone: true },
        { code: "EE 471", title: "Engineering Analysis & Design II", credits: 2, capstone: true },
        { code: "ME 481", title: "Quality & Reliability Assurance", credits: 3 },
      ],
    },
  ],
  notes: [
    "Concentrations are a minimum 21 hours; some may require additional hours.",
    "A grade of C or better is required in all CS and EE courses (Bulletin p.201, item 8).",
    "Restricted electives are limited to EE 303, EE 305, EE 306, EE 307, EE 308, EE 404, (≥ ME 2xx except 481) or (≥ CE 2xx).",
    "Departmental Exit Exam required in senior year with 70% pass rate.",
    "CE, EE and ME majors only need 9 hours in Area II and 9 hours in Area IV of General Education (3 hours fewer in each — see Bulletin p.67-68).",
  ],
};

export const CURRICULA: Record<string, Curriculum> = {
  [MATHEMATICS.slug]: MATHEMATICS,
  [PHYSICS.slug]: PHYSICS,
  [ELECTRICAL_ENGINEERING.slug]: ELECTRICAL_ENGINEERING,
};

/** Slugs of majors whose sample plan is available. */
export function hasCurriculum(slug: string): boolean {
  return slug in CURRICULA;
}

/** Slugs where a fully interactive planner exists (course DB + prereq scheduler). */
export function hasInteractivePlanner(slug: string): boolean {
  return slug === "computer-science";
}
