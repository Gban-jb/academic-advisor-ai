// Alabama A&M University — institutional info for the detail page.
// Facts sourced from the AAMU Wikipedia article; photos from Wikimedia Commons.

export interface UniversityPhoto {
  url: string;
  caption: string;
}

export const AAMU = {
  name: "Alabama A&M University",
  shortName: "AAMU",
  founded: 1875,
  location: "Normal, Alabama",
  type: "Public · Historically Black Land-Grant University",
  enrollment: "7,800+ students",
  colors: "Maroon & White",
  mascot: "Bulldogs",
  seal: "https://upload.wikimedia.org/wikipedia/en/9/93/Alabama_A%26M_University_Seal.png",
  hero: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Buchanan_Hall.jpg",
  description:
    "Alabama A&M University is a public, historically black, land-grant university founded in 1875 by Hampton-educated educator William Hooper Councill. Set on a hilltop campus in Normal, just north of Huntsville, AAMU offers 41 bachelor's degrees along with graduate and doctoral programs across its colleges of Engineering, Agricultural & Life Sciences, Business, and Education.",
  stats: [
    { label: "Founded", value: "1875" },
    { label: "Enrollment", value: "7,800+" },
    { label: "Bachelor's Degrees", value: "41" },
    { label: "Colors", value: "Maroon & White" },
  ] as { label: string; value: string }[],
  photos: [
    { url: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Buchanan_Hall.jpg", caption: "Buchanan Hall" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/a/a4/AAMU_Carnegie_Library_Dec10.jpg", caption: "Carnegie Library" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/5/58/William_Hooper_Councill.jpg", caption: "Founder William Hooper Councill" },
  ] as UniversityPhoto[],
};

// One major has a full planner ("the lab"): Computer Science. Others are listed.
export interface Major {
  name: string;
  college: string;
  planner?: boolean; // true = has a working degree planner
}

// College groupings and major names are taken from the AAMU Undergraduate
// Bulletin 2026-2027. Chemistry is in CETPS (Dept of Physics/Chem/Math), not
// CALNS. History is NOT offered as a standalone major at AAMU — only as a
// minor and as a Political Science teaching concentration — so it is not in
// this list.
export const MAJORS: Major[] = [
  { name: "Computer Science", college: "Engineering & Physical Sciences", planner: true },
  { name: "Electrical Engineering", college: "Engineering & Physical Sciences" },
  { name: "Mechanical Engineering", college: "Engineering & Physical Sciences" },
  { name: "Civil Engineering", college: "Engineering & Physical Sciences" },
  { name: "Mathematics", college: "Engineering & Physical Sciences" },
  { name: "Physics", college: "Engineering & Physical Sciences" },
  { name: "Chemistry", college: "Engineering & Physical Sciences" },
  { name: "Biology", college: "Agricultural & Life Sciences" },
  { name: "Food Science", college: "Agricultural & Life Sciences" },
  { name: "Animal Science", college: "Agricultural & Life Sciences" },
  { name: "Business Administration", college: "Business & Public Affairs" },
  { name: "Accounting", college: "Business & Public Affairs" },
  { name: "Marketing", college: "Business & Public Affairs" },
  { name: "Criminal Justice", college: "Business & Public Affairs" },
  { name: "Psychology", college: "Education, Humanities & Behavioral Sciences" },
  { name: "Social Work", college: "Education, Humanities & Behavioral Sciences" },
  { name: "English", college: "Education, Humanities & Behavioral Sciences" },
  { name: "Communications", college: "Education, Humanities & Behavioral Sciences" },
  { name: "Music", college: "Education, Humanities & Behavioral Sciences" },
];

export const MINORS: string[] = [
  "Computer Science", "Mathematics", "Physics", "Business Administration",
  "Accounting", "Psychology", "Sociology", "Spanish", "English", "History",
  "Political Science", "Music", "Art", "Biology", "Chemistry", "Criminal Justice",
];
