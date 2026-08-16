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

// ─── Per-major career profiles ────────────────────────────────────────────────

export interface Org {
  name: string;
  url: string;
  /** Built for Black or underrepresented professionals in the field. */
  hbcu?: boolean;
}

export interface MajorCareer {
  slug: string;
  /** Must match a name in MAJORS (university.ts). */
  major: string;
  field: Field;
  /** One or two sentences a student would actually find useful. */
  summary: string;
  roles: string[];
  /** Skills and credentials worth building before graduating. */
  build: string[];
  /** Where graduates of this major actually work, Huntsville first where it's true. */
  employers: string[];
  orgs: Org[];
  /** O*NET occupation search seeded for this major. */
  onetQuery: string;
}

export function majorSlug(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Career profiles for every AAMU undergraduate major.
 *
 * Huntsville matters here: Redstone Arsenal, NASA Marshall, Cummings Research
 * Park and HudsonAlpha are on AAMU's doorstep, and for most of these majors the
 * nearest serious employer is a short drive rather than a plane ride. Where that
 * is genuinely true for a major, it's said; where it isn't, it isn't.
 */
export const MAJOR_CAREERS: MajorCareer[] = [
  {
    slug: "computer-science", major: "Computer Science", field: "stem",
    summary: "The broadest major on this list — software runs through defense, space, healthcare and finance, and Huntsville has more of it per capita than almost any city its size.",
    roles: ["Software Engineer", "Data Engineer", "Cybersecurity Analyst", "ML / AI Engineer", "Cloud & DevOps Engineer", "Systems Engineer", "Product Manager"],
    build: ["Two or three projects on GitHub you can explain end to end", "Data structures and algorithms until interviews stop being scary", "One cloud platform (AWS, Azure or GCP) hands-on", "Security clearance eligibility — it opens most Huntsville doors"],
    employers: ["Redstone Arsenal contractors — Boeing, Northrop Grumman, Lockheed Martin, Leidos", "NASA Marshall Space Flight Center", "Cummings Research Park firms", "Big tech and startups nationwide"],
    orgs: [
      { name: "ACM", url: "https://www.acm.org" },
      { name: "IEEE Computer Society", url: "https://www.computer.org" },
      { name: "NSBE", url: "https://nsbe.org", hbcu: true },
      { name: "ColorStack", url: "https://www.colorstack.org", hbcu: true },
    ],
    onetQuery: "software developer",
  },
  {
    slug: "electrical-engineering", major: "Electrical Engineering", field: "stem",
    summary: "Circuits, power, signals and embedded systems. In Huntsville that means missiles, satellites and avionics — the work is here and it needs clearances.",
    roles: ["Electrical Design Engineer", "Embedded Systems Engineer", "RF / Communications Engineer", "Power Systems Engineer", "Test Engineer", "Controls Engineer"],
    build: ["A hardware project — FPGA, microcontroller, PCB — you built and debugged", "MATLAB and Simulink", "The FE exam in your senior year", "Security clearance eligibility"],
    employers: ["Redstone Arsenal and Army aviation/missile commands", "NASA Marshall", "Boeing, Northrop Grumman, Aerojet Rocketdyne", "TVA and regional utilities"],
    orgs: [
      { name: "IEEE", url: "https://www.ieee.org" },
      { name: "NSBE", url: "https://nsbe.org", hbcu: true },
    ],
    onetQuery: "electrical engineer",
  },
  {
    slug: "mechanical-engineering", major: "Mechanical Engineering", field: "stem",
    summary: "Anything that moves, heats, cools or carries load. Propulsion and aerospace structures are the local specialty.",
    roles: ["Mechanical Design Engineer", "Propulsion Engineer", "Manufacturing Engineer", "Thermal / HVAC Engineer", "Quality Engineer", "Project Engineer"],
    build: ["CAD fluency — SolidWorks or CATIA — with a portfolio of parts", "Hands-on fabrication or a formula/rocketry team", "The FE exam, then the PE after four years", "An internship every summer from sophomore year"],
    employers: ["NASA Marshall — propulsion is its core mission", "Boeing, Blue Origin, Aerojet Rocketdyne in the Huntsville corridor", "Toyota, Mazda and Mercedes plants across Alabama", "Federal labs and DoD contractors"],
    orgs: [
      { name: "ASME", url: "https://www.asme.org" },
      { name: "NSBE", url: "https://nsbe.org", hbcu: true },
    ],
    onetQuery: "mechanical engineer",
  },
  {
    slug: "civil-engineering", major: "Civil Engineering", field: "stem",
    summary: "Infrastructure — roads, water, structures, land. It is the most licensure-driven engineering path, and the PE is the whole career ladder.",
    roles: ["Structural Engineer", "Transportation Engineer", "Water Resources Engineer", "Geotechnical Engineer", "Construction Manager", "Land Development Engineer"],
    build: ["The FE exam before you graduate — non-negotiable", "AutoCAD and Civil 3D", "A summer with a contractor to see how drawings become buildings", "Then the PE licence after four years of practice"],
    employers: ["Alabama DOT and city/county engineering offices", "US Army Corps of Engineers", "Regional design firms and general contractors", "TVA"],
    orgs: [
      { name: "ASCE", url: "https://www.asce.org" },
      { name: "NSBE", url: "https://nsbe.org", hbcu: true },
    ],
    onetQuery: "civil engineer",
  },
  {
    slug: "mathematics", major: "Mathematics", field: "stem",
    summary: "The major that turns into other careers. Pair it with computing or statistics and it becomes one of the most flexible degrees you can hold.",
    roles: ["Data Scientist / Analyst", "Actuary", "Operations Research Analyst", "Cryptologic Mathematician", "Quantitative Analyst", "Secondary Math Teacher"],
    build: ["Python and R — mathematics without code is hard to hire", "Start the actuarial exams (P and FM) as an undergrad if that appeals", "A statistics or machine-learning minor's worth of coursework", "An REU — it is the single strongest signal for math grad school"],
    employers: ["National Security Agency — the largest employer of mathematicians in the US", "Insurance and actuarial firms", "Defense analytics contractors in Huntsville", "School districts, with Alabama certification"],
    orgs: [
      { name: "MAA", url: "https://www.maa.org" },
      { name: "SIAM", url: "https://www.siam.org" },
      { name: "NAM (National Association of Mathematicians)", url: "https://www.nam-math.org", hbcu: true },
    ],
    onetQuery: "mathematician statistician",
  },
  {
    slug: "physics", major: "Physics", field: "stem",
    summary: "Trains you to model unfamiliar problems from first principles. Most physics graduates go into industry or national labs rather than academia — and that is a good outcome, not a fallback.",
    roles: ["Research Physicist", "Optics / Photonics Engineer", "Materials Scientist", "Systems Analyst", "Medical Physicist (with grad school)", "Data Scientist"],
    build: ["Serious lab technique and instrumentation experience", "Computational physics — Python, numerical methods, simulation", "An REU or SULI summer, ideally two", "The Physics GRE if a PhD is the goal"],
    employers: ["NASA Marshall and its contractors", "Oak Ridge National Laboratory, a few hours away", "Optics and sensor firms in Cummings Research Park", "Graduate programs — physics PhDs are usually funded"],
    orgs: [
      { name: "American Physical Society", url: "https://www.aps.org" },
      { name: "National Society of Black Physicists", url: "https://www.nsbp.org", hbcu: true },
    ],
    onetQuery: "physicist",
  },
  {
    slug: "biology", major: "Biology", field: "life",
    summary: "The pre-health default, but far from the only route — biotech, environmental science and research careers all start here, and HudsonAlpha puts genomics on your doorstep.",
    roles: ["Research Technician", "Laboratory Scientist", "Biotechnology Associate", "Environmental Scientist", "Physician / Dentist / PA (with professional school)", "Science Teacher"],
    build: ["Bench research with a professor, starting sophomore year", "The MCAT/DAT timeline mapped out by junior year if pre-health", "Clinical or shadowing hours — professional schools expect them", "One summer program: ABRCMS, Amgen or an NIH lab"],
    employers: ["HudsonAlpha Institute for Biotechnology, in Huntsville", "Hospitals and clinical labs across north Alabama", "USDA, EPA and state environmental agencies", "Pharmaceutical and biotech firms"],
    orgs: [
      { name: "ABRCMS", url: "https://abrcms.org", hbcu: true },
      { name: "American Institute of Biological Sciences", url: "https://www.aibs.org" },
      { name: "BIO", url: "https://www.bio.org" },
    ],
    onetQuery: "biological scientist",
  },
  {
    slug: "chemistry", major: "Chemistry", field: "life",
    summary: "Analytical skill that industry pays for directly — quality labs, materials, pharma and forensics all hire chemists straight out of undergrad.",
    roles: ["Analytical Chemist", "Quality Control Chemist", "Materials Scientist", "Forensic Chemist", "Process Chemist", "Pharmacist (with PharmD)"],
    build: ["Instrumentation — HPLC, GC-MS, NMR — named on your résumé", "Undergraduate research, then present it at a conference", "ACS student chapter involvement", "Lab safety and documentation habits employers actually check"],
    employers: ["Chemical and materials manufacturers across Alabama", "Forensic and crime labs", "Pharmaceutical QC and process labs", "Federal labs — Oak Ridge, NASA materials groups"],
    orgs: [
      { name: "American Chemical Society", url: "https://www.acs.org" },
      { name: "NOBCChE", url: "https://www.nobcche.org", hbcu: true },
    ],
    onetQuery: "chemist",
  },
  {
    slug: "food-science", major: "Food Science", field: "life",
    summary: "Chemistry and biology applied to what people eat — product development, safety and regulation. AAMU's agricultural roots make this a genuine strength.",
    roles: ["Food Scientist", "Product Development Technologist", "Quality Assurance Manager", "Food Safety Inspector", "Sensory Scientist", "Regulatory Affairs Specialist"],
    build: ["HACCP certification — employers ask for it by name", "A product development project from formulation to sensory panel", "A summer in a commercial food plant", "Statistics for experimental design"],
    employers: ["USDA and FDA — inspection and regulatory roles", "Food manufacturers and co-packers across the Southeast", "Agricultural extension services", "Grocery and restaurant supply chains"],
    orgs: [
      { name: "Institute of Food Technologists", url: "https://www.ift.org" },
      { name: "MANRRS", url: "https://www.manrrs.org", hbcu: true },
    ],
    onetQuery: "food scientist",
  },
  {
    slug: "animal-science", major: "Animal Science", field: "life",
    summary: "Production, nutrition, and veterinary preparation. The pre-vet route is competitive and demands hours with animals starting early.",
    roles: ["Animal Nutritionist", "Livestock Production Manager", "Veterinarian (with DVM)", "Agricultural Extension Agent", "Animal Research Technician", "USDA Inspector"],
    build: ["Veterinary shadowing hours — hundreds, not dozens, if pre-vet", "Hands-on livestock or lab animal experience", "The GRE and a VMCAS timeline by junior year if pre-vet", "An extension or 4-H leadership role"],
    employers: ["USDA — research, inspection and extension", "Veterinary clinics and diagnostic labs", "Livestock and poultry operations across Alabama", "Land-grant research stations, including AAMU's own"],
    orgs: [
      { name: "American Society of Animal Science", url: "https://www.asas.org" },
      { name: "MANRRS", url: "https://www.manrrs.org", hbcu: true },
    ],
    onetQuery: "animal scientist",
  },
  {
    slug: "business-administration", major: "Business Administration", field: "business",
    summary: "The generalist business degree — its value comes from what you specialise it with. Internships matter more here than in almost any other major.",
    roles: ["Management Analyst", "Operations Manager", "Financial Analyst", "Human Resources Specialist", "Supply Chain Analyst", "Business Development Manager"],
    build: ["Excel to a genuinely advanced level, then SQL", "Two internships before senior year — this field recruits on experience", "A leadership role in a student organization", "A concentration you can name and defend in an interview"],
    employers: ["Defense contractors' program and business offices in Huntsville", "Regional banks and financial services", "Retail, logistics and healthcare systems", "Federal agencies through USAJOBS Pathways"],
    orgs: [
      { name: "National Black MBA Association", url: "https://nbmbaa.org", hbcu: true },
      { name: "SHRM", url: "https://www.shrm.org" },
    ],
    onetQuery: "management analyst",
  },
  {
    slug: "accounting", major: "Accounting", field: "business",
    summary: "The most direct line from major to profession on this list. The CPA is the credential the whole career turns on, and the 150-hour rule shapes your final year.",
    roles: ["Staff Accountant", "Auditor", "Tax Associate", "Forensic Accountant", "Government Accountant", "Controller (later career)"],
    build: ["Plan for the 150 credit hours the CPA requires — decide early", "Recruit for Big Four and regional firms in your junior fall", "Excel modelling and one accounting system (QuickBooks, SAP)", "Begin CPA exam sections as soon as you are eligible"],
    employers: ["Big Four and regional public accounting firms", "Federal agencies — GAO, IRS, DCAA (large presence in Huntsville)", "Defense contractor finance departments", "State and municipal government"],
    orgs: [
      { name: "AICPA", url: "https://www.aicpa.org" },
      { name: "NABA", url: "https://www.nabainc.org", hbcu: true },
    ],
    onetQuery: "accountant auditor",
  },
  {
    slug: "marketing", major: "Marketing", field: "business",
    summary: "Increasingly analytical — the work is as much measurement as it is creative. A portfolio of real campaigns beats a high GPA in hiring.",
    roles: ["Marketing Coordinator", "Digital Marketing Specialist", "Market Research Analyst", "Social Media Manager", "Brand Manager", "Sales Representative"],
    build: ["Google Analytics and Google Ads certifications — free and expected", "A portfolio: real campaigns, real numbers, even for a campus club", "Basic data skills — Excel, and SQL if you can", "Content you have actually shipped and can point to"],
    employers: ["Agencies and in-house marketing teams", "Retail and consumer brands", "Healthcare systems and universities", "Media companies — the T. Howard Foundation route"],
    orgs: [
      { name: "American Marketing Association", url: "https://www.ama.org" },
      { name: "National Black MBA Association", url: "https://nbmbaa.org", hbcu: true },
    ],
    onetQuery: "marketing manager",
  },
  {
    slug: "criminal-justice", major: "Criminal Justice", field: "humanities",
    summary: "Law enforcement, courts, corrections and federal agencies — plus a strong pre-law route. Federal jobs reward internships and clean records above all.",
    roles: ["Police Officer / Detective", "Federal Agent (FBI, ATF, DEA, Secret Service)", "Probation & Parole Officer", "Crime Analyst", "Paralegal", "Attorney (with law school)"],
    build: ["A federal internship through USAJOBS Pathways — the main hiring pipeline", "Physical fitness standards, if sworn roles interest you", "Statistics and crime-analysis tools", "The LSAT junior year if law school is the goal"],
    employers: ["FBI, ATF, DEA, US Marshals and Homeland Security", "State and municipal police departments", "Courts, probation and correctional systems", "Corporate security and investigations"],
    orgs: [
      { name: "Academy of Criminal Justice Sciences", url: "https://www.acjs.org" },
      { name: "NOBLE", url: "https://noblenational.org", hbcu: true },
    ],
    onetQuery: "police detective",
  },
  {
    slug: "psychology", major: "Psychology", field: "humanities",
    summary: "Be clear-eyed: most clinical careers require graduate school. The undergraduate degree is strong preparation for research, human resources and social services — and an excellent springboard.",
    roles: ["Research Assistant", "Case Manager", "Human Resources Specialist", "Behavioral Health Technician", "UX Researcher", "Clinical Psychologist / Counselor (with grad school)"],
    build: ["Research with a professor — essential for funded psychology PhDs", "Statistics and SPSS or R", "Direct client or volunteer hours in a human-services setting", "The GRE and a clear grad-school plan by junior year"],
    employers: ["Hospitals, clinics and community mental-health agencies", "School systems and social service agencies", "Corporate HR and people analytics", "Research universities and VA facilities"],
    orgs: [
      { name: "American Psychological Association", url: "https://www.apa.org" },
      { name: "Association of Black Psychologists", url: "https://abpsi.org", hbcu: true },
    ],
    onetQuery: "psychologist",
  },
  {
    slug: "social-work", major: "Social Work", field: "humanities",
    summary: "One of the few majors with a licensed professional path straight out of undergrad. A BSW often shortens an MSW to a single advanced-standing year.",
    roles: ["Case Manager", "Child & Family Social Worker", "Medical Social Worker", "Substance Abuse Counselor", "School Social Worker", "Licensed Clinical Social Worker (with MSW)"],
    build: ["Your field placement — treat it as a long job interview", "Alabama licensure requirements, checked early", "Crisis intervention and trauma-informed care training", "Advanced-standing MSW applications in senior fall"],
    employers: ["Alabama Department of Human Resources", "Hospitals and hospice organizations", "School districts", "Nonprofits and community agencies"],
    orgs: [
      { name: "NASW", url: "https://www.socialworkers.org" },
      { name: "NABSW", url: "https://www.nabsw.org", hbcu: true },
    ],
    onetQuery: "social worker",
  },
  {
    slug: "english", major: "English", field: "humanities",
    summary: "Writing and analysis transfer everywhere — the trick is proving it. Graduates who pair the degree with a portfolio and one technical skill compete well.",
    roles: ["Technical Writer", "Content Strategist", "Editor", "Communications Specialist", "Grant Writer", "Teacher / Professor (with certification or grad school)"],
    build: ["A public portfolio — clips, a blog, published campus journalism", "Technical writing skills; defense contractors hire for this constantly", "An editing or publishing internship", "Alabama teaching certification if the classroom appeals"],
    employers: ["Defense contractors — proposal and technical documentation teams", "Publishers, newsrooms and marketing agencies", "Universities and nonprofits — grant writing", "K-12 schools with certification"],
    orgs: [
      { name: "Modern Language Association", url: "https://www.mla.org" },
      { name: "Alabama educator certification", url: "https://www.alabamaachieves.org" },
    ],
    onetQuery: "technical writer",
  },
  // Note: AAMU does not offer a standalone History major (bulletin 2026-2027).
  // History is available as a minor and as a teaching concentration under
  // Political Science. Kept here for informational purposes only — it is
  // filtered out at the page level.
  {
    slug: "communications", major: "Communications", field: "humanities",
    summary: "Media, PR and strategic communication. Portfolio-first: what you have produced matters more than what you studied.",
    roles: ["Public Relations Specialist", "Social Media Manager", "Broadcast Producer", "Corporate Communications Specialist", "Journalist", "Media Relations Coordinator"],
    build: ["A reel or portfolio of published work — start freshman year", "Campus radio, TV or newspaper, then a real newsroom internship", "Video editing and design basics (Adobe suite)", "Analytics — modern comms roles measure everything"],
    employers: ["Local and national news outlets", "Corporate communications and PR agencies", "NASA and defense public affairs offices in Huntsville", "Universities, nonprofits and government"],
    orgs: [
      { name: "NABJ", url: "https://nabj.org", hbcu: true },
      { name: "PRSA", url: "https://www.prsa.org" },
      { name: "T. Howard Foundation", url: "https://www.t-howard.org", hbcu: true },
    ],
    onetQuery: "public relations specialist",
  },
  {
    slug: "music", major: "Music", field: "humanities",
    summary: "Performance is only one door. Education, production, therapy and arts administration are where most sustainable music careers are built — and AAMU's marching band tradition is a network in itself.",
    roles: ["Music Educator", "Performer / Session Musician", "Audio Engineer / Producer", "Music Therapist (with certification)", "Arts Administrator", "Church Music Director"],
    build: ["Alabama teaching certification alongside the degree — it is the steadiest path", "Recording and production skills (Pro Tools, Logic)", "A performance portfolio and a professional reel", "Business literacy: contracts, royalties, self-employment taxes"],
    employers: ["K-12 school systems and university music programs", "Recording studios and production houses", "Churches and community arts organizations", "Military bands — a stable, pensioned performance career"],
    orgs: [
      { name: "NAfME", url: "https://nafme.org" },
      { name: "National Association of Negro Musicians", url: "https://www.nanm.org", hbcu: true },
    ],
    onetQuery: "musician music teacher",
  },
];
