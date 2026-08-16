/**
 * Curated career content for the Careers hub.
 *
 * Every URL here was checked live before being added. Entries are tagged by
 * field so the hub can narrow to what's relevant for a student's major — an
 * accounting major shouldn't have to wade through REU sites to find INROADS.
 */

export type Field = "stem" | "life" | "business" | "humanities";

export const FIELD_LABELS: Record<Field, string> = {
  stem: "STEM & Engineering",
  life: "Life Sciences",
  business: "Business",
  humanities: "Humanities & Social Sciences",
};

/** Which field bucket each AAMU major belongs to (names match `MAJORS` in university.ts). */
export const MAJOR_FIELDS: Record<string, Field> = {
  "Computer Science": "stem",
  "Electrical Engineering": "stem",
  "Mechanical Engineering": "stem",
  "Civil Engineering": "stem",
  "Mathematics": "stem",
  "Physics": "stem",
  "Biology": "life",
  "Chemistry": "life",
  "Food Science": "life",
  "Animal Science": "life",
  "Business Administration": "business",
  "Accounting": "business",
  "Marketing": "business",
  "Criminal Justice": "humanities",
  "Psychology": "humanities",
  "Social Work": "humanities",
  "English": "humanities",
  "History": "humanities",
  "Communications": "humanities",
  "Music": "humanities",
};

export interface CareerLink {
  name: string;
  url: string;
  blurb: string;
  /** Which fields this serves; "all" shows under every filter. */
  fields: Field[] | "all";
  /** Built for HBCU students or underrepresented groups — gets a Bulldogs badge. */
  hbcu?: boolean;
  /** Lives on this site rather than externally. */
  internal?: boolean;
}

export interface CareerSection {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  links: CareerLink[];
}

export const CAREER_SECTIONS: CareerSection[] = [
  {
    id: "internships",
    title: "Internships & Jobs",
    icon: "💼",
    tagline: "Openings you can apply to right now.",
    links: [
      {
        name: "The Advising Place internship board",
        url: "/internships",
        blurb:
          "Our live board — software, AI/ML, quant, product and hardware internships for upcoming terms, refreshed daily. Save the ones you like.",
        fields: "all",
        internal: true,
      },
      {
        name: "Handshake",
        url: "https://joinhandshake.com",
        blurb:
          "The platform most university career offices post through — internships and entry-level roles across every major, many marked early-career only.",
        fields: "all",
      },
      {
        name: "USAJOBS Pathways",
        url: "https://www.usajobs.gov",
        blurb:
          "Federal internships and recent-graduate programs — every agency, every major, and a real route to a government career.",
        fields: "all",
      },
      {
        name: "INROADS",
        url: "https://inroads.org",
        blurb:
          "Paid corporate internships plus coaching for underrepresented students — strongest in business, but placing across industries since 1970.",
        fields: ["business", "stem", "humanities"],
        hbcu: true,
      },
      {
        name: "T. Howard Foundation",
        url: "https://www.t-howard.org",
        blurb:
          "Internships in media and entertainment for diverse students — communications, marketing, production and the business side of media.",
        fields: ["humanities", "business"],
        hbcu: true,
      },
    ],
  },
  {
    id: "hackathons",
    title: "Hackathons",
    icon: "⚡",
    tagline: "Build something in a weekend; leave with a project and people.",
    links: [
      {
        name: "Major League Hacking",
        url: "https://mlh.io",
        blurb:
          "The official collegiate hackathon league — a season calendar of student hackathons, most free to attend, many with travel support.",
        fields: ["stem"],
      },
      {
        name: "Devpost",
        url: "https://devpost.com/hackathons",
        blurb:
          "The biggest directory of online and in-person hackathons, filterable by theme and prize — a good first hackathon is on here.",
        fields: ["stem"],
      },
      {
        name: "NASA Space Apps Challenge",
        url: "https://www.spaceappschallenge.org",
        blurb:
          "NASA's global hackathon, open to coders and non-coders alike — teams need storytellers, designers and scientists, not just programmers.",
        fields: "all",
      },
      {
        name: "AfroTech",
        url: "https://afrotech.com",
        blurb:
          "The largest Black tech conference — talks, recruiting and community. Not a hackathon strictly, but the room you want to be in.",
        fields: ["stem", "business"],
        hbcu: true,
      },
    ],
  },
  {
    id: "research",
    title: "Research Opportunities",
    icon: "🔬",
    tagline: "Paid summer research — the standard path to grad school.",
    links: [
      {
        name: "NSF REU",
        url: "https://www.nsf.gov/crssprgm/reu/",
        blurb:
          "Research Experiences for Undergraduates — paid summer research at universities nationwide, in everything from math to marine biology.",
        fields: ["stem", "life"],
      },
      {
        name: "DOE SULI",
        url: "https://science.osti.gov/wdts/suli",
        blurb:
          "Paid internships at U.S. national labs — Oak Ridge is a few hours from campus. Physics, chemistry, computing, engineering.",
        fields: ["stem", "life"],
      },
      {
        name: "NASA internships",
        url: "https://intern.nasa.gov",
        blurb:
          "Paid NASA internships across engineering, science, and even communications — Marshall Space Flight Center is right in Huntsville.",
        fields: ["stem", "life", "humanities"],
      },
      {
        name: "NIH training programs",
        url: "https://www.training.nih.gov",
        blurb:
          "Paid biomedical research at the National Institutes of Health — biology, chemistry, psychology and pre-health students especially.",
        fields: ["life", "humanities"],
      },
      {
        name: "CRA-WP DREU",
        url: "https://cra.org/cra-wp/dreu/",
        blurb:
          "Distributed Research Experiences for Undergraduates — matched one-on-one with a computing researcher for a paid summer; built to widen who does CS research.",
        fields: ["stem"],
        hbcu: true,
      },
      {
        name: "Amgen Scholars",
        url: "https://www.amgenscholars.com",
        blurb:
          "Fully funded summer biotech research at top host universities for students eyeing science PhDs or MD-PhDs.",
        fields: ["life"],
      },
      {
        name: "McNair Scholars Program",
        url: "https://www2.ed.gov/programs/triomcnair/index.html",
        blurb:
          "Federal TRIO program preparing first-generation and underrepresented students for doctoral study — research, mentoring and grad-school support.",
        fields: "all",
        hbcu: true,
      },
    ],
  },
  {
    id: "fellowships",
    title: "Fellowships & Scholarships",
    icon: "🏅",
    tagline: "Money and mentorship — several of these are built for Bulldogs.",
    links: [
      {
        name: "Thurgood Marshall College Fund",
        url: "https://www.tmcf.org",
        blurb:
          "Scholarships, internships and leadership programs exclusively for students at public HBCUs — AAMU is a member school.",
        fields: "all",
        hbcu: true,
      },
      {
        name: "UNCF",
        url: "https://uncf.org",
        blurb:
          "The largest private scholarship provider for Black students — hundreds of programs across every major, with rolling deadlines.",
        fields: "all",
        hbcu: true,
      },
      {
        name: "GEM Fellowship",
        url: "https://www.gemfellowship.org",
        blurb:
          "Fully funded master's or PhD in engineering and science for underrepresented students, paired with paid industry internships.",
        fields: ["stem", "life"],
        hbcu: true,
      },
      {
        name: "NSBE scholarships",
        url: "https://nsbe.org",
        blurb:
          "The National Society of Black Engineers — scholarships, a huge annual convention with on-the-spot interviews, and an AAMU chapter to join.",
        fields: ["stem"],
        hbcu: true,
      },
      {
        name: "DoD SMART Scholarship",
        url: "https://www.smartscholarship.org",
        blurb:
          "Full tuition plus a stipend in exchange for working at a Department of Defense lab after graduation — a job and a degree in one.",
        fields: ["stem", "life"],
      },
      {
        name: "NSF GRFP",
        url: "https://www.nsfgrfp.org",
        blurb:
          "Three years of funded graduate study — seniors apply in the fall. The most prestigious award a STEM senior can put on an application.",
        fields: ["stem", "life"],
      },
      {
        name: "Code2040 Fellows",
        url: "https://code2040.org",
        blurb:
          "A summer fellowship placing Black and Latinx CS students in top tech internships, with a community that lasts past the summer.",
        fields: ["stem"],
        hbcu: true,
      },
      {
        name: "MLT Career Prep",
        url: "https://mlt.org",
        blurb:
          "An 18-month coached fellowship for Black, Latinx and Native American students headed into business and tech careers.",
        fields: ["business", "stem"],
        hbcu: true,
      },
    ],
  },
  {
    id: "resources",
    title: "More Resources",
    icon: "🧭",
    tagline: "Explore careers, compare pay, and get help on campus.",
    links: [
      {
        name: "AAMU Career Development Services",
        url: "https://www.aamu.edu/campus-life/student-support/career-development/",
        blurb:
          "Your on-campus career office — résumé reviews, career fairs, mock interviews and graduation clearance. Start here.",
        fields: "all",
        hbcu: true,
      },
      {
        name: "O*NET OnLine",
        url: "https://www.onetonline.org",
        blurb:
          "The Department of Labor's career explorer — what people in any occupation actually do, earn, and need to know.",
        fields: "all",
      },
      {
        name: "Occupational Outlook Handbook",
        url: "https://www.bls.gov/ooh/",
        blurb:
          "Bureau of Labor Statistics projections — which careers are growing, median pay, and the degree each one expects.",
        fields: "all",
      },
      {
        name: "ColorStack",
        url: "https://www.colorstack.org",
        blurb:
          "A community of thousands of Black and Latinx CS students — peer support, recruiting pipelines and a very active Slack.",
        fields: ["stem"],
        hbcu: true,
      },
      {
        name: "levels.fyi",
        url: "https://www.levels.fyi",
        blurb:
          "Real, verified tech compensation — know what an offer should look like before you negotiate one.",
        fields: ["stem", "business"],
      },
      {
        name: "NeetCode",
        url: "https://neetcode.io",
        blurb:
          "The free, structured way to prepare for coding interviews — curated problem lists with video explanations.",
        fields: ["stem"],
      },
    ],
  },
];
