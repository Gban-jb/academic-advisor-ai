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

/**
 * CHEMISTRY — 120-122 Credit Hours — Bulletin p.213
 */
const CHEMISTRY: Curriculum = {
  slug: "chemistry", major: "Chemistry", totalCredits: "120-122", bulletinPage: 213,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 125", title: "Calculus I", credits: 4 },
        { code: "CHE 101", title: "General Chemistry I", credits: 3, minC: true },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1, minC: true },
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { title: "HED 101 / PED / MSC 101", credits: 2 },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { code: "MTH 126", title: "Calculus II", credits: 4, minC: true },
        { code: "CHE 102", title: "General Chemistry II", credits: 3, minC: true },
        { code: "CHE 102L", title: "General Chemistry II Lab", credits: 1, minC: true },
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { title: `Literature – ${GENED}`, credits: 3 },
        { code: "MTH 227", title: "Calculus III", credits: 4, minC: true },
        { code: "CHE 251", title: "Organic Chemistry I", credits: 3, minC: true },
        { code: "CHE 251L", title: "Organic Chemistry I Lab", credits: 1, minC: true },
        { code: "CS 102", title: "Intro to Programming", credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "MTH 237", title: "Intro to Linear Algebra", credits: 3, minC: true },
        { code: "CHE 252", title: "Organic Chemistry II", credits: 3, minC: true },
        { code: "CHE 252L", title: "Organic Chemistry II Lab", credits: 1, minC: true },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { code: "CS 109", title: "Intro to Programming II", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "MTH 238", title: "Applied Differential Equations", credits: 3, minC: true },
        { code: "CHE 221", title: "Analytical Chemistry", credits: 3, minC: true },
        { code: "CHE 221L", title: "Analytical Chemistry Lab", credits: 1, minC: true },
        { code: "PHY 213", title: "General Physics with Calculus I", credits: 4 },
        { code: "CHE 308", title: "Special Topics", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { code: "CHE 303", title: "Inorganic Chemistry", credits: 3, minC: true },
        { code: "CHE 303L", title: "Inorganic Chemistry Lab", credits: 1, minC: true },
        { code: "CHE 409", title: "Instrumental Methods", credits: 3, minC: true },
        { code: "CHE 409L", title: "Instrumental Methods Lab", credits: 1, minC: true },
        { code: "PHY 214", title: "General Physics with Calculus II", credits: 4 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 14, courses: [
        { title: "CHE Elective", credits: 4, minC: true },
        { code: "CHE 401", title: "Physical Chemistry I", credits: 3, minC: true },
        { code: "CHE 401L", title: "Physical Chemistry I Lab", credits: 1, minC: true },
        { code: "CHE 403", title: "Research I", credits: 2, capstone: true },
        { code: "CHE 407", title: "Biochemistry I", credits: 3, minC: true },
        { code: "CHE 407L", title: "Biochemistry I Lab", credits: 1, minC: true },
      ]},
      { label: "Second Semester", credits: 11, creditsRange: [9, 11], courses: [
        { title: "CHE Elective", credits: 4, minC: true, note: "3–5 credits" },
        { code: "CHE 402", title: "Physical Chemistry II", credits: 3, minC: true },
        { code: "CHE 402L", title: "Physical Chemistry II Lab", credits: 1, minC: true },
        { code: "CHE 404", title: "Research II", credits: 2, capstone: true },
        { title: "Free Elective", credits: 1 },
      ]},
    ]},
  ],
  notes: [
    "A grade of C or better is required in physics, chemistry and mathematics courses (Bulletin p.212, item 8).",
    "Chemistry majors may not combine lecture or lab sequences of unrelated courses (Bulletin p.212, item 14).",
    "Each lecture course must be taken with its corresponding lab.",
    "Honors CHE major: replace CHE 101/L with CHE 101H/L and CHE 102/L with CHE 102H/L.",
  ],
};

/**
 * MECHANICAL ENGINEERING — 128 Credit Hours — Bulletin p.197-198
 */
const MECHANICAL_ENGINEERING: Curriculum = {
  slug: "mechanical-engineering", major: "Mechanical Engineering", totalCredits: "128", bulletinPage: 197,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 125", title: "Calculus I", credits: 4, minC: true },
        { code: "CHE 101", title: "General Chemistry I", credits: 3 },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
        { code: "ME 101", title: "Intro to Mechanical Engineering", credits: 1, minC: true },
        { code: "ME 101L", title: "Intro to Mechanical Engineering Lab", credits: 1, minC: true },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { code: "MTH 126", title: "Calculus II", credits: 4, minC: true },
        { code: "PHY 213", title: "General Physics with Calculus I", credits: 4, minC: true },
        { code: "ME 103", title: "Computer-Aided Design I", credits: 3, minC: true },
        { code: "ME 104", title: "Engineering Programming I", credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { code: "MTH 227", title: "Calculus III", credits: 4, minC: true },
        { code: "PHY 214", title: "General Physics with Calculus II", credits: 4, minC: true },
        { code: "ME 205", title: "Statics", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { code: "MTH 238", title: "Applied Differential Equations", credits: 3 },
        { code: "ME 204", title: "Engineering Analysis", credits: 3 },
        { code: "ME 206", title: "Dynamics", credits: 3, minC: true },
        { code: "EE 201", title: "Linear Circuit Analysis I", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "ME 231", title: "Strength of Materials", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3 },
        { code: "ME 310", title: "Thermodynamics", credits: 3, minC: true },
        { code: "ME 360", title: "Fluid Mechanics I", credits: 3, minC: true },
        { code: "ME 360L", title: "Fluid Mechanics I Lab", credits: 1, minC: true },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ME 320", title: "Kinematics/Dynamics of Machines", credits: 3, minC: true },
        { code: "ME 313L", title: "Experimental Mechanics Lab", credits: 1, minC: true },
        { code: "ME 301", title: "Analysis/Instrumentation of Physical Systems", credits: 2, minC: true },
        { code: "ME 301L", title: "Analysis/Instrumentation of Physical Systems Lab", credits: 1, minC: true },
        { code: "ME 380", title: "Computer-Aided Design II", credits: 3, minC: true },
        { code: "ME 312", title: "Heat and Mass Transfer", credits: 3, minC: true },
        { code: "ME 312L", title: "Heat and Mass Transfer Lab", credits: 1, minC: true },
        { title: "Concentration Course", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature – ${GENED}`, credits: 3 },
        { title: "Concentration Course", credits: 3 },
        { code: "ME 451", title: "Automatic Control Systems", credits: 3, minC: true },
        { code: "ME 470", title: "Mech Engg Design Project I", credits: 2, capstone: true },
        { title: "Concentration Course", credits: 3 },
        { title: "Concentration Course", credits: 1 },
      ]},
      { label: "Second Semester", credits: 14, courses: [
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: "Concentration Course", credits: 3 },
        { code: "ME 475", title: "Mech Engg Design Project II", credits: 2, capstone: true },
        { title: "Concentration Course", credits: 3 },
      ]},
    ]},
  ],
  concentrations: [
    { slug: "general-mechanical-engineering", name: "General Mechanical Engineering (GME)", totalCredits: "22",
      courses: [
        { code: "ME 210", title: "Material Science", credits: 3 },
        { code: "ME 300", title: "Math Methods in Mechanical Engg", credits: 3 },
        { code: "ME 425", title: "Design of Machine Element", credits: 3 },
        { code: "ME 432", title: "Design for Mfg & Reliability + Lab", credits: 4 },
        { title: "ME 4xx", credits: 3 },
        { title: "ME 4xx (or ME 5xx-6xx in 5-yr program)", credits: 3 },
        { title: "ME 4xx (or ME 5xx-6xx in 5-yr program)", credits: 3 },
      ]},
    { slug: "manufacturing-systems", name: "Manufacturing Systems (MS)", totalCredits: "22",
      courses: [
        { code: "ME 210", title: "Material Science", credits: 3 },
        { code: "ME 300", title: "Math Methods in Mechanical Engg", credits: 3 },
        { code: "ME 425", title: "Design of Machine Element", credits: 3 },
        { code: "ME 432", title: "Design Mfg & Reliability + Lab", credits: 4 },
        { code: "ME 472", title: "Economic Eval of Design Project", credits: 3 },
        { code: "ME 481", title: "Quality Reliability Assurance", credits: 3, note: "or ME 581 in 5-yr program" },
        { code: "ME 482", title: "Operations Planning & Scheduling", credits: 3, note: "or ME 582 in 5-yr program" },
      ]},
    { slug: "propulsion-systems", name: "Propulsion Systems (PS)", totalCredits: "22",
      courses: [
        { code: "ME 210", title: "Material Science", credits: 3 },
        { code: "ME 300", title: "Math Methods in Mechanical Engg", credits: 3 },
        { code: "ME 412", title: "A/S Gas Turbines/Comp + Lab", credits: 4, note: "or ME 512 in 5-yr program" },
        { code: "ME 413", title: "Rocket Propulsion", credits: 3, note: "or ME 513 in 5-yr program" },
        { code: "ME 416", title: "Gas Dynamics", credits: 3 },
        { code: "ME 417", title: "Power System Integ & Perf", credits: 3 },
        { code: "ME 425", title: "Design of Machine Element", credits: 3 },
      ]},
    { slug: "nuclear-systems", name: "Nuclear Systems (NSY)", totalCredits: "22",
      courses: [
        { code: "ME 210", title: "Material Science", credits: 3 },
        { code: "ME 300", title: "Math Methods in Mechanical Engg", credits: 3 },
        { code: "ME 307", title: "Fund of Nuclear Engineering", credits: 3, note: "or EE 307" },
        { code: "ME 425", title: "Design of Machine Element", credits: 3 },
        { code: "ME 441", title: "Renewable Energy", credits: 3 },
        { code: "ME 460", title: "Nuclear Reactor Engineering I", credits: 3, note: "or EE 460" },
        { code: "ME 461", title: "Nuclear Reactor Engineering II", credits: 3, note: "or EE 461" },
        { title: "ME 4xx Elective Lab", credits: 1 },
      ]},
  ],
  notes: [
    "A grade of C or better is required in each ME course.",
    "Prerequisites must be earned with C or better before advanced courses.",
    "CE, EE and ME majors need only 9 hours each in Areas II and IV of General Education.",
  ],
};

/**
 * CIVIL ENGINEERING — 130 Credit Hours — Bulletin p.195
 */
const CIVIL_ENGINEERING: Curriculum = {
  slug: "civil-engineering", major: "Civil Engineering", totalCredits: "130", bulletinPage: 195,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 125", title: "Calculus I", credits: 4 },
        { code: "CHE 101", title: "General Chemistry I", credits: 3 },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
        { code: "PHY 213", title: "General Physics with Calculus I", credits: 4 },
        { code: "CE 101", title: "Intro to Civil Engineering", credits: 1, minC: true },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { code: "EGC 104", title: "Computer Programming", credits: 3, minC: true },
        { code: "CHE 102", title: "General Chemistry II", credits: 3 },
        { code: "CHE 102L", title: "General Chemistry II Lab", credits: 1 },
        { code: "EGC 101", title: "Engineering Drawing/Graphics", credits: 3, minC: true },
        { code: "MTH 126", title: "Calculus II", credits: 4 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 19, courses: [
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { code: "MTH 227", title: "Calculus III", credits: 4 },
        { code: "PHY 214", title: "General Physics with Calculus II", credits: 4 },
        { code: "EGC 205", title: "Statics", credits: 3, minC: true },
        { code: "CE 201", title: "Surveying", credits: 3, minC: true },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { code: "MTH 238", title: "Applied Differential Equations", credits: 3 },
        { code: "EE 201", title: "Linear Circuit Analysis I", credits: 3, minC: true },
        { code: "EGC 206", title: "Dynamics", credits: 3, minC: true },
        { code: "EGC 207", title: "Strength of Materials", credits: 3, minC: true },
        { code: "EGC 207L", title: "Strength of Materials Lab", credits: 1, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "EGC 204", title: "Engineering Analysis", credits: 3, minC: true },
        { code: "EGC 305", title: "Fluid Mechanics", credits: 3, minC: true },
        { code: "EGC 305L", title: "Fluid Mechanics Lab", credits: 1, minC: true },
        { code: "CE 306", title: "Structural Analysis I", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { code: "CE 304", title: "Environmental Engineering", credits: 3, minC: true },
        { code: "CE 305", title: "Hydrogeology", credits: 3, minC: true },
        { code: "CE 308", title: "Soil Mechanics", credits: 3, minC: true },
        { code: "CE 308L", title: "Soil Mechanics Lab", credits: 1, minC: true },
        { code: "CE 310", title: "Transportation Systems", credits: 3, minC: true },
        { code: "CE 401", title: "Structural Steel Design", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature – ${GENED}`, credits: 3 },
        { code: "CE 402", title: "Reinforced Concrete Design", credits: 3, minC: true },
        { code: "CE 408", title: "Foundation Design", credits: 3, minC: true },
        { code: "CE 410", title: "Transportation Engg & Design", credits: 3, minC: true },
        { code: "CE 424", title: "Civil Engineering Practice", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 13, courses: [
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { code: "CE 404", title: "Hydraulic Engg & Design", credits: 3, minC: true },
        { code: "CE 440", title: "Fundamentals of Engineering", credits: 1 },
        { code: "CE 470", title: "Civil Engg Design Project", credits: 3, capstone: true },
        { title: "CE 4xx or NRE 494, 495", credits: 3, minC: true },
      ]},
    ]},
  ],
  notes: [
    "Complete each EGC course with a grade of C or better.",
    "Take the Fundamentals of Engineering (FE) Examination prior to graduation.",
    "Any CE or EGC course that is a prereq to the CE major or EGC courses requires a grade of C or better.",
    "CE, EE and ME majors need only 9 hours each in Areas II and IV of General Education.",
  ],
};

/**
 * BIOLOGY — 123 Credit Hours — Bulletin p.74
 */
const BIOLOGY: Curriculum = {
  slug: "biology", major: "Biology", totalCredits: "123", bulletinPage: 74,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: `MTH – ${GENED}`, credits: 3, note: "except MTH 110" },
        { code: "BIO 103", title: "Principles of Biology", credits: 3, minC: true },
        { code: "BIO 103L", title: "Principles of Biology Lab", credits: 1, minC: true },
        { code: "BIO 100", title: "Careers in Life Science", credits: 1, minC: true },
        { code: "CHE 101", title: "General Chemistry I", credits: 3 },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
        { title: "HED 101 / MSC 101 / PED 102", credits: 2 },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: "BIO 203 or BIO 204", credits: 3, minC: true },
        { title: "BIO 203 Lab or BIO 204 Lab", credits: 1, minC: true },
        { code: "CHE 102", title: "General Chemistry II", credits: 3 },
        { code: "CHE 102L", title: "General Chemistry II Lab", credits: 1 },
        { code: "MTH 113", title: "Pre-Calculus Trigonometry", credits: 3 },
        { title: "NRE 199 or CS 101", credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature – ${GENED}`, credits: 3 },
        { code: "CHE 251", title: "Organic Chemistry I", credits: 3 },
        { code: "CHE 251L", title: "Organic Chemistry I Lab", credits: 1 },
        { code: "BIO 221", title: "Human Anatomy/Physiology I", credits: 3, minC: true },
        { code: "BIO 221L", title: "Human Anat/Phys Lab I", credits: 1, minC: true },
        { code: "MTH 125", title: "Calculus I", credits: 4 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Area II – Literature – ${GENED}`, credits: 3 },
        { code: "BIO 222", title: "Human Anatomy/Physiology II", credits: 3, minC: true },
        { code: "BIO 222L", title: "Human Anat/Phys Lab II", credits: 1, minC: true },
        { code: "CHE 252", title: "Organic Chemistry II", credits: 3 },
        { code: "CHE 252L", title: "Organic Chemistry II Lab", credits: 1 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "PHY 213", title: "General Physics with Calculus I", credits: 4 },
        { code: "BIO 311", title: "Genetics", credits: 3, minC: true },
        { code: "BIO 311L", title: "Genetics Lab", credits: 1, minC: true },
        { title: `History Sequence – ${GENED}`, credits: 3 },
        { title: "BIO Major Elective", credits: 4, minC: true },
      ]},
      { label: "Second Semester", credits: 14, courses: [
        { code: "PHY 214", title: "General Physics with Calculus II", credits: 4 },
        { code: "BIO 330", title: "Microbiology", credits: 3, minC: true },
        { code: "BIO 330L", title: "Microbiology Lab", credits: 1, minC: true },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 14, courses: [
        { code: "BIO 411", title: "Cell and Molecular Biology", credits: 3, minC: true },
        { code: "BIO 411L", title: "Cell and Molecular Biology Lab", credits: 1, minC: true },
        { code: "CHE 407", title: "Biochemistry", credits: 3 },
        { code: "CHE 407L", title: "Biochemistry Lab", credits: 1 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { code: "BIO 434", title: "Physiology", credits: 3, minC: true },
        { code: "BIO 434L", title: "Physiology Lab", credits: 1, minC: true },
        { title: "Free Elective", credits: 4 },
        { title: "BIO Major Elective", credits: 4, minC: true },
      ]},
    ]},
  ],
  notes: [
    "All BIO majors must have a grade of C or above in all BIO-prefixed courses.",
    "Biology-Pre-Professional Health majors must maintain a ≥ 3.0 GPA from second semester freshman onward.",
    "All students must take the departmental Exit Exam and achieve 125+.",
    "Available concentrations: Environmental Health, Pre-Nursing, Pre-Professional Health, Secondary Education Teacher (6-12), UTeach Teacher (6-12).",
  ],
};

/**
 * FOOD SCIENCE — 126 Credit Hours — Bulletin p.97
 */
const FOOD_SCIENCE: Curriculum = {
  slug: "food-science", major: "Food Science", totalCredits: "126", bulletinPage: 97,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 112", title: "Pre-Calculus Algebra", credits: 3 },
        { code: "CHE 101", title: "General Chemistry I", credits: 3 },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "FAS 102", title: "Intro to Food Science", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { code: "MTH 113", title: "Pre-Calculus Trigonometry", credits: 3 },
        { code: "CHE 102", title: "General Chemistry II", credits: 3 },
        { code: "CHE 102L", title: "General Chemistry II Lab", credits: 1 },
        { code: "BIO 103", title: "Principles of Biology", credits: 3 },
        { code: "BIO 103L", title: "Principles of Biology Lab", credits: 1 },
        { code: "FAS 101", title: "Foods for Life", credits: 2 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `History – ${GENED}`, credits: 3 },
        { code: "NRE 199", title: "Technology in Ag & Bio Sciences", credits: 3 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science Elective – ${GENED}`, credits: 3 },
        { code: "FAS 306", title: "Sensory Evaluation", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 14, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science Elective – ${GENED}`, credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "FAS 241", title: "Undergraduate Scientific Writing", credits: 2, minC: true },
        { code: "FAS 351", title: "Nutrition and Metabolism", credits: 3, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "MTH 125", title: "Calculus I", credits: 4 },
        { code: "CHE 251", title: "Organic Chemistry I", credits: 3 },
        { code: "CHE 251L", title: "Organic Chemistry I Lab", credits: 1 },
        { code: "BIO 330", title: "Microbiology", credits: 3 },
        { code: "BIO 330L", title: "Microbiology Lab", credits: 1 },
        { code: "FAS 402", title: "Meat & Poultry Sci & Technology", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "PHY 201", title: "General Physics with Trig I", credits: 4 },
        { code: "FAS 442", title: "Fruits, Vegs, & Cereal Prod Tech", credits: 4, minC: true },
        { code: "FAS 453L", title: "Agricultural Biochemistry", credits: 4, minC: true },
        { code: "FAS 450", title: "Regulations of Food Safety & Quality", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: "NRE 430 or FAS 440", credits: 3 },
        { code: "FAS 401L", title: "Food Microbiology", credits: 4, minC: true },
        { code: "FAS 407L", title: "Food Chemistry", credits: 4, minC: true },
        { code: "FAS 461L", title: "Food Engineering", credits: 4, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "FAS 403", title: "Seminar", credits: 1 },
        { code: "FAS 408L", title: "Food/Feed Analysis", credits: 4, minC: true },
        { code: "FAS 490", title: "Food Science Capstone", credits: 3, capstone: true },
        { code: "FAS 472L", title: "Food Processing", credits: 4, minC: true },
        { title: "Food Science Elective", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "Complete all major courses with a grade of C or better.",
    "Per AGSC, no more than six hours of HIS may be used to fulfill Area IV of General Education.",
  ],
};

/**
 * ANIMAL BIO-HEALTH SCIENCES (mapped from "Animal Science" major) — 124 Credit Hours — Bulletin p.96
 */
const ANIMAL_SCIENCE: Curriculum = {
  slug: "animal-science", major: "Animal Bio-Health Sciences", totalCredits: "124", bulletinPage: 96,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 14, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: `MTH – ${GENED}`, credits: 3 },
        { title: "BIO 101 or BIO 102 or BIO 103", credits: 3 },
        { title: "BIO 101/102/103 Lab", credits: 1 },
        { code: "FAS 112", title: "Intro to Animal Bio-Health Sciences", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { code: "MTH 113", title: "Pre-Calculus Trigonometry", credits: 3 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { code: "CHE 101", title: "General Chemistry I", credits: 3 },
        { code: "CHE 101L", title: "General Chemistry I Lab", credits: 1 },
        { code: "FAS 101", title: "Foods For Life", credits: 2 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `History – ${GENED}`, credits: 3 },
        { code: "CHE 102", title: "General Chemistry II", credits: 3 },
        { code: "CHE 102L", title: "General Chemistry II Lab", credits: 1 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "FAS 245", title: "Practicum I", credits: 2 },
        { code: "FAS 352", title: "Feeds & Feeding", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "NRE 199", title: "Technology in Ag & Bio Sciences", credits: 3 },
        { code: "FAS 351", title: "Nutrition & Metabolism", credits: 3, minC: true },
        { code: "FAS 259", title: "Companion Animal Mgt", credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 14, courses: [
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { code: "CHE 251", title: "Organic Chemistry", credits: 3 },
        { code: "CHE 251L", title: "Organic Chemistry Lab I", credits: 1 },
        { code: "PHY 201", title: "General Physics with Trig I", credits: 4 },
        { code: "FAS 357", title: "Monogastric Animal Mgt", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "BIO 330", title: "Microbiology", credits: 3 },
        { code: "BIO 330L", title: "Microbiology Lab", credits: 1 },
        { code: "FAS 320", title: "Animal Biosecurity & Diseases", credits: 3, minC: true },
        { code: "FAS 345", title: "Practicum II", credits: 2 },
        { code: "FAS 353", title: "Animal Breeding & Genetics", credits: 3, minC: true },
        { code: "FAS 358", title: "Ruminant Animal Mgt", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 14, courses: [
        { code: "FAS 403", title: "Seminar", credits: 1, minC: true },
        { code: "FAS 424", title: "Animal Models in Biomedical Res", credits: 3, minC: true },
        { code: "FAS 440", title: "Research Methods in Bioscience", credits: 3, minC: true },
        { code: "FAS 460", title: "Animal Anatomy & Physiology", credits: 3, minC: true },
        { code: "FAS 462", title: "Animal Parasitology", credits: 3, minC: true },
        { code: "FAS 491", title: "Animal Health Internship", credits: 1, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "FAS 408L", title: "Food/Feed Analysis", credits: 4, minC: true },
        { code: "FAS 430L", title: "Physiology of Reproduction", credits: 4, minC: true },
        { code: "FAS 453L", title: "Agricultural Biochemistry", credits: 4, minC: true },
        { code: "FAS 492", title: "Animal Bio-Hlth Sci Capstone", credits: 3, capstone: true },
      ]},
    ]},
  ],
  notes: [
    "Complete all major courses with a grade of C or better.",
    "Lab must match lecture.",
    "Available concentration: Animal Bio-Health Sciences.",
  ],
};

/**
 * BUSINESS ADMINISTRATION — 120-123 Credit Hours — Bulletin p.123
 */
const BUSINESS_ADMINISTRATION: Curriculum = {
  slug: "business-administration", major: "Business Administration", totalCredits: "120-123", bulletinPage: 123,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 112", title: "Pre-Calculus Algebra", credits: 3, minC: true },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: "HIS Elective", credits: 3 },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "MTH 120", title: "Calculus and its Applications", credits: 3, minC: true },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { code: "ECO 230", title: "Princ of Microeconomics", credits: 3 },
        { code: "MIS 213", title: "Comp Applications in Business", credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "ACC 203", title: "Financial Accounting Principles", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { code: "ECO 231", title: "Princ of Macroeconomics", credits: 3 },
        { code: "ECO 271", title: "Business Statistics I", credits: 3, minC: true },
        { code: "MGT 207", title: "Legal Env and Ethics", credits: 3 },
        { code: "ACC 204", title: "Managerial Accounting Principles", credits: 3, minC: true },
        { code: "ELO 250", title: "Prof Dev & Workforce Readiness", credits: 3, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "FIN 315", title: "Princ of Finance", credits: 3, minC: true },
        { code: "MIS 315", title: "Princ of Mgt Info Systems", credits: 3, minC: true },
        { code: "MGT 315", title: "Princ of Management", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "BUS 390", title: "ELO in Business Admin", credits: 3, minC: true, capstone: true },
        { code: "MKT 315", title: "Princ of Marketing", credits: 3, minC: true },
        { title: "HIS 207 / PSC 206 / SOC 210", credits: 3 },
        { title: "Concentration Course", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 12, courses: [
        { title: "Free Elective", credits: 3 },
        { title: "Concentration Course", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, minC: true },
        { code: "MGT 413", title: "Production Operations Mgt", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 12, creditsRange: [12, 15], courses: [
        { code: "MGT 442", title: "Strategic Mgt and Policy", credits: 3, capstone: true },
        { title: "Concentration Course", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, minC: true },
        { title: "Concentration Course", credits: 3, note: "3–6 credits" },
      ]},
    ]},
  ],
  notes: [
    "Concentrations are a minimum 21 hours; some may require additional hours.",
    "Available concentrations: International Business, Management Information Systems, Business Analytics.",
    "A grade of C or better is required in major coursework.",
    "Take the Senior Exit Exam for the AAMU business program.",
    "All business electives must be upper-level (300 to 499) unless otherwise stated.",
  ],
};

/**
 * ACCOUNTING — 120 Credit Hours — Bulletin p.118
 */
const ACCOUNTING: Curriculum = {
  slug: "accounting", major: "Accounting", totalCredits: "120", bulletinPage: 118,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 17, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 112", title: "Pre-Calculus Algebra", credits: 3, minC: true },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
        { code: "ACC 101", title: "Accounting Prof Development I", credits: 1 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { code: "MIS 213", title: "Comp Applications in Business", credits: 3 },
        { code: "MTH 120", title: "Calculus and its Applications", credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "ECO 230", title: "Princ of Microeconomics", credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "ACC 203", title: "Financial Accounting Principles", credits: 3, minC: true },
        { code: "ACC 304", title: "Accounting Prof Development II", credits: 1 },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: "HIS 207 / PSC 206 / SOC 210", credits: 3 },
        { code: "ECO 231", title: "Princ of Macroeconomics", credits: 3 },
        { code: "ECO 271", title: "Business Statistics I", credits: 3, minC: true },
        { code: "ACC 204", title: "Managerial Accounting Principles", credits: 3, minC: true },
        { code: "MGT 207", title: "Legal Env and Ethics", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 13, courses: [
        { code: "ACC 301", title: "Intermediate Accounting I", credits: 3, minC: true },
        { code: "ACC 321", title: "Accounting Analytics & Decisions", credits: 3, minC: true },
        { code: "FIN 315", title: "Princ of Finance", credits: 3, minC: true },
        { code: "MKT 315", title: "Princ of Marketing", credits: 3, minC: true },
        { code: "ACC 395", title: "Accounting Internship", credits: 1, capstone: true },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { code: "ACC 302", title: "Intermediate Accounting II", credits: 3, minC: true },
        { code: "ACC 303", title: "Cost Accounting and Analytics", credits: 3, minC: true },
        { code: "MGT 315", title: "Princ of Management", credits: 3, minC: true },
        { title: "ACC / MIS / CS 3xx-4xx", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "MGT 413", title: "Production Operations Mgt", credits: 3 },
        { code: "ACC 306", title: "Intermediate Accounting III", credits: 3, minC: true },
        { code: "ACC 372", title: "AIS, Bus Processes & Analytics", credits: 3, minC: true },
        { title: "Free Elective", credits: 3 },
        { title: "ACC / MIS / CS 3xx-4xx", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { code: "ACC 351", title: "Taxation I", credits: 3, minC: true },
        { code: "ACC 441", title: "Auditing, Risk Assess & Control", credits: 3, minC: true },
        { code: "MGT 442", title: "Strategic Mgt and Policy", credits: 3, capstone: true },
        { title: "ACC / MIS / CS 3xx-4xx", credits: 3, minC: true },
      ]},
    ]},
  ],
  notes: [
    "Complete the accounting program to meet Alabama CPA exam course/credit requirements.",
    "A grade of C or better is required in major coursework.",
    "All business electives must be upper-level (300-499).",
  ],
};

/**
 * MARKETING — 120 Credit Hours — Bulletin p.127
 */
const MARKETING: Curriculum = {
  slug: "marketing", major: "Marketing", totalCredits: "120", bulletinPage: 127,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 112", title: "Pre-Calculus I", credits: 3, minC: true },
        { title: "Science Elective", credits: 3 },
        { title: "Science Elective Lab", credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "MTH 120", title: "Calculus and its Applications", credits: 3, minC: true },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { code: "MIS 213", title: "Comp Applications in Business", credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "ECO 230", title: "Princ of Microeconomics", credits: 3 },
        { code: "ACC 203", title: "Financial Accounting Principles", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { code: "ECO 271", title: "Business Statistics I", credits: 3, minC: true },
        { code: "MGT 207", title: "Legal Env and Ethics", credits: 3 },
        { code: "ECO 231", title: "Princ of Macroeconomics", credits: 3 },
        { code: "ACC 204", title: "Managerial Accounting Principles", credits: 3, minC: true },
        { code: "ELO 250", title: "Prof Dev & Workforce Readiness", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "FIN 315", title: "Princ of Finance", credits: 3 },
        { code: "MIS 315", title: "Princ of Mgt Info Systems", credits: 3 },
        { code: "MKT 315", title: "Princ of Marketing", credits: 3, minC: true },
        { code: "MGT 315", title: "Princ of Management", credits: 3 },
        { title: "NonBusiness Elective", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "MKT 390", title: "ELO in Marketing", credits: 3, minC: true, capstone: true },
        { code: "MKT 316", title: "Buyer Behavior", credits: 3, minC: true },
        { code: "MKT 323", title: "Promotions Management", credits: 3, minC: true },
        { title: "MKT 3xx-4xx Elective", credits: 3, minC: true },
        { title: "HIS 207 / PSC 206 / SOC 210", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 12, courses: [
        { code: "MKT 410", title: "Marketing Research", credits: 3, minC: true },
        { title: "MKT 3xx-4xx Elective", credits: 3, minC: true },
        { title: "NonBusiness Elective", credits: 3 },
        { code: "MGT 413", title: "Production Operations Mgt", credits: 3 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { code: "MGT 442", title: "Strategic Mgt and Policy", credits: 3, capstone: true },
        { code: "MKT 464", title: "Global Marketing", credits: 3, minC: true },
        { code: "MKT 487", title: "Strategic Marketing", credits: 3, minC: true },
        { title: "Free Elective", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "A grade of C or better is required in major coursework.",
    "All business electives must be upper-level (300-499).",
    "Take the Senior Exit Exam for the AAMU business program.",
  ],
};

/**
 * CRIMINAL JUSTICE — 126 Credit Hours — Bulletin p.133
 */
const CRIMINAL_JUSTICE: Curriculum = {
  slug: "criminal-justice", major: "Criminal Justice", totalCredits: "126", bulletinPage: 133,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: `MTH – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: `PED / MSC / HED – ${GENED}`, credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: "CS 101 or MIS 213", credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "PSC 205", title: "American Government", credits: 3, minC: true },
        { code: "CRJ 250", title: "Intro to Criminal Justice", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { code: "PSC 206", title: "State & Local Government", credits: 3, minC: true },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "HIS 204", title: "Intro to African American History", credits: 3 },
        { code: "PSC 310", title: "African American Politics", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { code: "ENG 304", title: "Advanced Composition", credits: 3, minC: true },
        { code: "CRJ 252", title: "Criminal Law", credits: 3, minC: true },
        { title: "SOC 265 / PSY 265 / ECO 271", credits: 3, minC: true },
        { title: "CRJ Major Elective", credits: 3, minC: true },
        { title: "Minor Course", credits: 3 },
        { code: "CRJ 355", title: "Criminal Justice Administration", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 18, courses: [
        { code: "SOC 201", title: "Intro to Sociology", credits: 3, minC: true },
        { title: "CRJ Major Elective", credits: 3, minC: true },
        { title: "CRJ 253 / SOC 253", credits: 3, minC: true },
        { code: "CRJ 254", title: "Intro to Corrections", credits: 3, minC: true },
        { code: "DSS 390", title: "Dept of Soc Sciences ELO", credits: 3, capstone: true },
        { title: "Minor Course", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: "SOC 443 / CRJ 443 / PSC 443", credits: 3, minC: true },
        { title: "CRJ Major Elective", credits: 3, minC: true },
        { code: "CRJ 451", title: "Rules of Evidence in Crim Cases", credits: 3, minC: true },
        { title: "CRJ 351 / SOC 351 Criminology", credits: 3, minC: true },
        { title: "Minor Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { title: "Minor Course", credits: 3 },
        { title: "Minor Course", credits: 3 },
        { title: "Minor Course", credits: 3 },
        { title: "Free Elective", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "All Criminal Justice majors must complete a minor.",
    "A grade of C or better is required in major and minor coursework.",
    "All Dept of Social Sciences majors must take PAME I (freshman year) and pass PAME II (senior year).",
    "Complete a Senior Record Check and Data Profile Sheet.",
    "Minors are a minimum 18 hours; some may require additional 1-2 hours.",
  ],
};

/**
 * PSYCHOLOGY — 122 Credit Hours — Bulletin p.166
 */
const PSYCHOLOGY: Curriculum = {
  slug: "psychology", major: "Psychology", totalCredits: "122", bulletinPage: 166,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { code: "MTH 112", title: "Pre-Calculus Algebra", credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: "PED 102 / HED 101", credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: "SOC 201 / PSY 211 / PSC 201 / PSC 205", credits: 3 },
        { code: "ART 101", title: "Art Appreciation", credits: 3, minC: true },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "CS 101", title: "Fund of Comp & Info Systems", credits: 3 },
        { code: "PSY 201", title: "General Psychology", credits: 3 },
        { title: "Elem Foreign Language Sequence", credits: 3, minC: true },
        { title: "PHL 201 / PHL 203 / PHL 206", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { title: "PSY 265 / SOC 265 Elem Statistics", credits: 3, minC: true },
        { title: "Elem Foreign Language Sequence", credits: 3, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: "Humanities/FA not already taken", credits: 3, minC: true },
        { code: "PSY 202", title: "History & Systems of Psychology", credits: 3, minC: true },
        { code: "PSY 307", title: "Intro to Research", credits: 3, minC: true },
        { title: "PSY Elective", credits: 3, minC: true },
        { title: "Minor or Track Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 13, creditsRange: [13, 16], courses: [
        { title: "Humanities/FA not already taken", credits: 3, minC: true },
        { code: "PSY 416", title: "Experimental Psychology", credits: 3, minC: true },
        { code: "PSY 416L", title: "Experimental Psychology Lab", credits: 1, minC: true },
        { title: "PSY Elective", credits: 3, minC: true },
        { title: "Minor or Track Course", credits: 0, note: "0 or 3 credits (see footnote 5)" },
        { title: "Minor or Track Course", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 13, courses: [
        { code: "PSY 415", title: "Physiological Psychology", credits: 3, minC: true },
        { code: "PSY 415L", title: "Physiological Psychology Lab", credits: 1, minC: true },
        { title: "PSY Elective", credits: 3, minC: true },
        { title: "PSY Elective", credits: 3, minC: true },
        { title: "Minor or Track Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, creditsRange: [12, 15], courses: [
        { code: "PSY 404", title: "Seminar in Psychology", credits: 3, capstone: true },
        { code: "PSY 471", title: "Abnormal Psychology", credits: 3, minC: true },
        { title: "PSY Elective", credits: 3, minC: true, note: "0 or 3 credits if Track required" },
        { title: "Minor or Track Course", credits: 3 },
        { title: "Minor or Track Course", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "All Psychology majors must have a minor area of concentration.",
    "Available tracks: Sports Psychology, Clinical Psychology, Forensic Psychology.",
    "Grades lower than C will not be counted toward major or minor requirements.",
    "Take the departmental Exit Exam senior year with 70% pass rate.",
    "Minors are 18 hours minimum; some require additional 1-2 hours.",
  ],
};

/**
 * SOCIAL WORK — 121 Credit Hours — Bulletin p.171
 */
const SOCIAL_WORK: Curriculum = {
  slug: "social-work", major: "Social Work", totalCredits: "121", bulletinPage: 171,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: "HIS 101 / 201 Sequence", credits: 3 },
        { code: "BIO 101", title: "General Biology I", credits: 3 },
        { code: "BIO 101L", title: "General Biology I Lab", credits: 1 },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { code: "HED 101", title: "Personal & Community Health", credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: "HIS 102 / 202 Sequence", credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { code: "CS 101", title: "Fund of Comp & Info Systems", credits: 3 },
        { title: "PSC 201 / 205 / 206", credits: 3, minC: true },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { code: "SWK 202", title: "Intro Social Welfare & Social Work", credits: 3, minC: true },
        { title: `Literature – ${GENED}`, credits: 3 },
        { code: "PHL 201", title: "Intro to Philosophy", credits: 3, minC: true },
        { code: "SOC 201", title: "Intro to Sociology", credits: 3 },
        { title: "Elem Foreign Language Sequence", credits: 3 },
        { title: `Math – ${GENED}`, credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Literature – ${GENED}`, credits: 3 },
        { code: "SWK 301", title: "Human Behavior I", credits: 3, minC: true },
        { code: "PSY 201", title: "General Psychology", credits: 3 },
        { title: "Elem Foreign Language Sequence", credits: 3 },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { code: "SWK 302", title: "Human Behavior II", credits: 3, minC: true },
        { code: "SWK 304", title: "Diverse Populations", credits: 3, minC: true },
        { code: "SWK 312", title: "Social Work Methods I", credits: 3, minC: true },
        { title: "SWK 205 or SWK 311", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "ENG 304", title: "Advanced Composition", credits: 3, minC: true },
        { title: "PSY 265 / SOC 265 Elem Statistics", credits: 3 },
        { code: "SWK 313", title: "Social Work Methods II", credits: 3, minC: true },
        { code: "SOC 210", title: "Social Problems", credits: 3, minC: true },
        { code: "SWK 305", title: "Rural Human Services", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 12, courses: [
        { code: "SWK 314", title: "Social Work Methods III", credits: 3, minC: true },
        { code: "SWK 403", title: "Social Welfare Policies", credits: 3, minC: true },
        { code: "SWK 410", title: "Social Work Research Methods", credits: 3, minC: true },
        { title: "SWK 205 / 303 / 308 / 311 / 315", credits: 3, minC: true },
      ]},
      { label: "Second Semester", credits: 13, courses: [
        { code: "SWK 414", title: "Field Instruction", credits: 8, minC: true, capstone: true },
        { code: "SWK 414L", title: "Field Instruction Seminar", credits: 3, capstone: true },
        { code: "SWK 415", title: "Senior Seminar Research", credits: 2, capstone: true },
      ]},
    ]},
  ],
  notes: [
    "Fully accredited by the Council on Social Work Accreditation (CSWE) since 1979.",
    "Prereqs to SWK 202: 31 hours of General Education and 2.5 cumulative GPA.",
    "All social work majors must take classes in sequential order.",
    "Grades lower than C will not be counted toward major/minor requirements.",
    "Minimum 2.5 GPA required to graduate.",
    "The BSW degree does not award academic credit for life or work experience.",
    "Literatures must be in a sequence; foreign language 101/102 French or Spanish.",
  ],
};

/**
 * ENGLISH — 120 Credit Hours — Bulletin p.157
 */
const ENGLISH: Curriculum = {
  slug: "english", major: "English", totalCredits: "120", bulletinPage: 157,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 105", title: "Composition & Rhetoric I", credits: 3, minC: true },
        { title: `Math – ${GENED}`, credits: 3 },
        { title: "Elem Foreign Language Sequence", credits: 3, note: "French or Spanish" },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: "PED / HED 101 / MSC 101", credits: 2 },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 106", title: "Composition & Rhetoric II", credits: 3, minC: true },
        { code: "CS 101", title: "Fund of Comp & Info Systems", credits: 3 },
        { title: "Elem Foreign Language Sequence", credits: 3, note: "French or Spanish" },
        { title: `History – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ENG 203", title: "World Literature I Sequence", credits: 3 },
        { title: "Science Elective", credits: 3 },
        { title: "Science Elective Lab", credits: 1 },
        { code: "ENG 201", title: "English Literature I", credits: 3, minC: true },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
      ]},
      { label: "Second Semester", credits: 16, courses: [
        { code: "ENG 204", title: "World Literature II Sequence", credits: 3 },
        { title: "Science Elective", credits: 3 },
        { title: "Science Elective Lab", credits: 1 },
        { code: "ENG 202", title: "English Literature II", credits: 3, minC: true },
        { title: `Economics – ${GENED}`, credits: 3 },
        { code: "ENG 300", title: "Intro to Discipline of English", credits: 3, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "ENG 207", title: "American Literature I", credits: 3, minC: true },
        { code: "ENG 325", title: "African American Literature I", credits: 3, minC: true },
        { code: "ENG 405", title: "Advanced Grammar", credits: 3, minC: true },
        { title: "Minor OR Track Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { code: "ENG 208", title: "American Literature II", credits: 3, minC: true },
        { code: "ENG 308", title: "Literary Criticism", credits: 3, minC: true },
        { code: "ENG 316", title: "Adv Writing for ENG Majors", credits: 3, minC: true },
        { code: "ENG 326", title: "African American Literature II", credits: 3, minC: true },
        { title: "Minor OR Track Course", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { code: "ENG 407", title: "Senior Seminar", credits: 3, minC: true, capstone: true },
        { title: "Minor OR Track Course", credits: 3 },
        { title: "Minor OR Track Course", credits: 3 },
        { title: "ENG 3xx-4xx OR Free Elective", credits: 3 },
        { title: "ENG 3xx-4xx OR Free Elective", credits: 3 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { title: "Minor OR Track Course", credits: 3 },
        { title: "Minor Course OR Free Elective", credits: 3 },
        { title: "ENG 3xx-4xx OR Free Elective", credits: 3 },
        { title: "ENG 3xx-4xx OR Free Elective", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "Complete six hours of a foreign language (French or Spanish).",
    "Available tracks: Literature and Writing, Literature and Cultural Studies, Professional and Creative Writing, Pre-Law.",
    "Students selecting a Minor complete 12 hours of ENG 3xx-4xx electives; Track students complete 15 hours of Free Electives.",
    "A grade of C or above must be earned in each major course.",
    "Take the departmental Exit Exam senior year.",
    "Minors are 18 hours minimum; some require additional hours.",
  ],
};

/**
 * COMMUNICATIONS MEDIA (mapped from "Communications" major) — 120 Credit Hours — Bulletin p.175
 */
const COMMUNICATIONS: Curriculum = {
  slug: "communications", major: "Communications Media", totalCredits: "120", bulletinPage: 175,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: `Math – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { title: `History – ${GENED}`, credits: 3 },
        { title: "HED 101 / PED / MSC 101", credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { code: "COMM 201", title: "Intro to Mass Media", credits: 3, minC: true },
        { title: "CS 101 or ART 103", credits: 3 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 18, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "PHL 201", title: "Intro to Philosophy", credits: 3 },
        { code: "COMM 202", title: "Fundamentals of TV Production", credits: 3, minC: true },
        { code: "COMM 205", title: "Public Speaking for Com Arts Pro", credits: 3, minC: true },
        { title: "COMM 2xx Elective", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "ENG 205", title: "General Speech", credits: 3 },
        { code: "SOC 201", title: "Intro to Sociology", credits: 3, minC: true },
        { code: "COMM 214", title: "Careers in Media Arts", credits: 3, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 15, courses: [
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "ENG 304", title: "Advanced Composition", credits: 3, minC: true },
        { code: "COMM 211", title: "Broadcast Law & Regulations", credits: 3, minC: true },
        { code: "COMM 212", title: "Writing for Broadcasting", credits: 3, minC: true },
        { title: "COMM 3xx-4xx Elective", credits: 3 },
      ]},
      { label: "Second Semester", credits: 15, courses: [
        { title: "COMM 3xx-4xx Elective", credits: 3 },
        { title: "COMM 3xx-4xx Elective", credits: 3 },
        { title: "COMM 3xx-4xx Elective", credits: 3 },
        { title: "3xx-4xx Free Elective", credits: 3 },
        { title: "Concentration Course", credits: 3 },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 12, courses: [
        { title: "COMM 3xx-4xx Elective", credits: 3 },
        { title: "3xx-4xx Free Elective", credits: 3 },
        { title: "Concentration Course", credits: 3 },
        { title: "Concentration Course", credits: 3 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { title: "Concentration Course", credits: 3 },
        { title: "Concentration Course", credits: 3 },
        { title: "Concentration Course", credits: 3 },
        { title: "Concentration Course", credits: 3 },
      ]},
    ]},
  ],
  notes: [
    "Available concentrations: Performance, Production.",
    "All communications media majors must take COMM 401 & 402 (Practicum I and II) and secure professional internships.",
    "Concentrations are a minimum 21 hours; some may require additional hours.",
  ],
};

/**
 * MUSIC — 120 Credit Hours — Bulletin p.176
 */
const MUSIC: Curriculum = {
  slug: "music", major: "Music", totalCredits: "120", bulletinPage: 176,
  years: [
    { label: "Freshman Year", semesters: [
      { label: "First Semester", credits: 19, courses: [
        { code: "ORI 101", title: "First Year Experience", credits: 1 },
        { code: "ENG 101", title: "Composition I", credits: 3, minC: true },
        { title: `Math – ${GENED}`, credits: 3 },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { code: "MUS 001", title: "Music Seminar I", credits: 0, minC: true },
        { code: "MUS 102", title: "Fundamentals of Music", credits: 3, minC: true, note: "Or Entrance Exam placement" },
        { title: "Music Ensemble", credits: 1, minC: true },
        { title: "Applied Music – Major Instr/Voice", credits: 1, minC: true },
        { title: `Fine Arts – ${GENED}`, credits: 3 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { code: "ORI 102", title: "First Year Experience", credits: 1 },
        { code: "ENG 102", title: "Composition II", credits: 3, minC: true },
        { title: `Sci lecture – ${GENED}`, credits: 3 },
        { title: `Sci lab – ${GENED}`, credits: 1 },
        { code: "MUS 002", title: "Music Seminar II", credits: 0, minC: true },
        { title: "Music Ensemble", credits: 1, minC: true },
        { title: "Applied Music – Major Instr/Voice", credits: 1, minC: true },
        { code: "MUS 103", title: "Music Theory I", credits: 2, minC: true },
        { title: "PED / HED 101", credits: 2 },
        { code: "MUS 103A", title: "Aural Skills I", credits: 1, minC: true },
        { code: "MUS 141A", title: "Class Piano I", credits: 2 },
      ]},
    ]},
    { label: "Sophomore Year", semesters: [
      { label: "First Semester", credits: 16, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Computer Lit – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { code: "MUS 104", title: "Music Theory II", credits: 2, minC: true },
        { code: "MUS 003", title: "Music Seminar III", credits: 0, minC: true },
        { title: "Applied Music – Major Instr/Voice", credits: 1, minC: true },
        { title: "Music Ensemble", credits: 1, minC: true },
        { code: "MUS 104A", title: "Aural Skills II", credits: 1, minC: true },
        { code: "MUS 241A", title: "Group Class Piano II", credits: 2 },
      ]},
      { label: "Second Semester", credits: 17, courses: [
        { title: `Literature Sequence – ${GENED}`, credits: 3 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: `Humanities/Fine Art – ${GENED}`, credits: 3 },
        { title: "Music Ensemble", credits: 1, minC: true },
        { title: "Applied Music – Major Instr/Voice", credits: 1, minC: true },
        { code: "MUS 004", title: "Music Seminar IV", credits: 0, minC: true },
        { code: "MUS 205", title: "Music Theory III", credits: 2, minC: true },
        { title: `History – ${GENED}`, credits: 3 },
        { code: "MUS 205A", title: "Aural Skills III", credits: 1, minC: true },
      ]},
    ]},
    { label: "Junior Year", semesters: [
      { label: "First Semester", credits: 13, courses: [
        { code: "MUS 303", title: "Music History & Literature I", credits: 2, minC: true },
        { code: "MUS 309", title: "Basic Conducting", credits: 1, minC: true },
        { title: "Applied Music – Major Instr/Voice", credits: 1, minC: true },
        { title: "Concentration Course(s)", credits: 3 },
        { title: "Concentration Course(s)", credits: 3 },
        { code: "MUS 005", title: "Music Seminar V", credits: 0, minC: true },
        { code: "MUS 206", title: "Music Theory IV", credits: 2, minC: true },
        { code: "MUS 206A", title: "Aural Skills IV", credits: 1, minC: true },
      ]},
      { label: "Second Semester", credits: 13, courses: [
        { title: "Concentration Course(s)", credits: 2 },
        { title: `Social/Behavioral Science – ${GENED}`, credits: 3 },
        { title: "Concentration Course(s)", credits: 3 },
        { code: "MUS 304", title: "Music History & Literature II", credits: 2, minC: true },
        { code: "MUS 320", title: "Form and Analysis", credits: 3, minC: true },
      ]},
    ]},
    { label: "Senior Year", semesters: [
      { label: "First Semester", credits: 13, courses: [
        { title: "Concentration Course(s)", credits: 3 },
        { title: "Concentration Course(s)", credits: 3 },
        { title: "Advisor-Approved Elective(s)", credits: 3 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
      ]},
      { label: "Second Semester", credits: 12, courses: [
        { title: "Concentration Course(s)", credits: 2 },
        { title: "Concentration Course(s)", credits: 2 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
        { title: "Advisor-Approved Elective(s)", credits: 2 },
      ]},
    ]},
  ],
  notes: [
    "Music concentrations offered: Music Business, General Music, Music Performance (with Piano Pedagogy, Sacred Music sub-tracks), Secondary Education Choral Teacher (P-12), Secondary Education Instrumental Teacher (P-12).",
    "Entrance Examination for theory placement required for all first-year music majors. Score below 70% must take MUS 102 first.",
    "Students who test out of MUS 102 must take an elective approved by advisor.",
    "All music majors must take individual applied instruction in one performance area throughout their undergraduate years.",
    "Non-piano majors must study piano for 2-3 consecutive semesters (MUS 141A → 241A → 341A).",
    "Required to perform in public during student recitals; jury performance at end of each semester.",
    "A grade of C or higher required in all music courses.",
    "All music majors (except General Music) required to perform in a senior recital.",
  ],
};

export const CURRICULA: Record<string, Curriculum> = {
  [MATHEMATICS.slug]: MATHEMATICS,
  [PHYSICS.slug]: PHYSICS,
  [ELECTRICAL_ENGINEERING.slug]: ELECTRICAL_ENGINEERING,
  [CHEMISTRY.slug]: CHEMISTRY,
  [MECHANICAL_ENGINEERING.slug]: MECHANICAL_ENGINEERING,
  [CIVIL_ENGINEERING.slug]: CIVIL_ENGINEERING,
  [BIOLOGY.slug]: BIOLOGY,
  [FOOD_SCIENCE.slug]: FOOD_SCIENCE,
  [ANIMAL_SCIENCE.slug]: ANIMAL_SCIENCE,
  [BUSINESS_ADMINISTRATION.slug]: BUSINESS_ADMINISTRATION,
  [ACCOUNTING.slug]: ACCOUNTING,
  [MARKETING.slug]: MARKETING,
  [CRIMINAL_JUSTICE.slug]: CRIMINAL_JUSTICE,
  [PSYCHOLOGY.slug]: PSYCHOLOGY,
  [SOCIAL_WORK.slug]: SOCIAL_WORK,
  [ENGLISH.slug]: ENGLISH,
  [COMMUNICATIONS.slug]: COMMUNICATIONS,
  [MUSIC.slug]: MUSIC,
};

/** Slugs of majors whose sample plan is available. */
export function hasCurriculum(slug: string): boolean {
  return slug in CURRICULA;
}

/** Slugs where a fully interactive planner exists (course DB + prereq scheduler). */
export function hasInteractivePlanner(slug: string): boolean {
  return slug === "computer-science";
}
