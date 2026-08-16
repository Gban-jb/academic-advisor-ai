import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { norm, type Grade } from "@/lib/data";

const VALID_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE_MB = 20;

// Map raw AI grade strings to our Grade type
function normalizeGrade(raw: string): Grade {
  const g = raw.trim().toUpperCase();
  const valid: Grade[] = [
    "A+","A","A-","B+","B","B-","C+","C","C-",
    "D+","D","D-","F","W","WF","I",
    "TA","TB","TC","S","CR","P","REG",
  ];
  if (valid.includes(g as Grade)) return g as Grade;

  // In-progress / registered courses
  if (
    g === "REG" || g === "REGISTERED" || g === "IN PROGRESS" ||
    g === "IN_PROGRESS" || g === "INPROGRESS" || g === "IP" ||
    g === "ENROLLED" || g === "CURRENT"
  ) return "REG";

  // Common variants
  if (g.startsWith("TRANSFER") || g.startsWith("TR")) {
    if (g.includes("A")) return "TA";
    if (g.includes("B")) return "TB";
    return "TC";
  }
  if (g === "PASS" || g === "SATISFACTORY") return "P";
  if (g === "CREDIT") return "CR";
  if (g === "WITHDRAWN") return "W";
  if (g === "WITHDRAW FAILING") return "WF";
  if (g === "INCOMPLETE") return "I";

  // Fallback: try the first character
  const first = g[0];
  if (["A","B","C","D","F","W","I","S","P"].includes(first)) return first as Grade;

  return "F"; // unknown → treat as failing to be safe
}

const PROMPT = `You are reading a college academic transcript.
Extract the cumulative GPA and every course listed. Return ONLY a JSON object — no markdown, no explanation, nothing else.

The JSON object must have exactly these top-level fields:
- "gpa": the latest cumulative (overall) GPA as a number (e.g. 3.45). If not found, use null.
- "courses": an array of course objects

Each course object must have exactly these fields:
- "code": the course code (e.g. "CS 102", "MTH 125", "ENG 101", "MATH 211")
- "grade": the grade received (e.g. "A", "B+", "C-", "D", "F", "W", "TA", "TB", "TC", "REG")
- "credits": credit hours as a number (e.g. 3, 4, 1)
- "term": semester and year as a string (e.g. "Fall 2025", "Spring 2026", "Fall 2024")

Rules:
- For GPA: look for "Cumulative GPA", "Overall GPA", or "Cum GPA". Always use the LATEST/MOST RECENT value.
- For transfer courses, use "TA" for A-range, "TB" for B-range, "TC" for C-range grades.
- CRITICAL: For any course listed under a "Courses in Progress", "In Progress", or "Currently Enrolled" section — courses with NO grade yet — use grade "REG". These are courses the student is currently taking this semester. Do NOT skip them.
- Include ALL courses that appear — passed, failed, withdrawn, and in-progress.
- If a completed course has a grade that is missing or illegible, omit that course.
- Do not invent courses that are not on the transcript.
- Return ONLY the JSON object, starting with { and ending with }.

Example output:
{"gpa":3.45,"courses":[{"code":"CS 102","grade":"A","credits":3,"term":"Fall 2025"},{"code":"MTH 125","grade":"B+","credits":4,"term":"Spring 2026"},{"code":"CS 314","grade":"REG","credits":3,"term":"Fall 2026"}]}`;

export async function POST(req: NextRequest) {
  const unauthorized = await requireSession(req);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured on server." }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Upload a PDF, PNG, or JPG." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Max ${MAX_SIZE_MB}MB.` }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: file.type, data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      }
    );
  } catch (err) {
    return NextResponse.json({ error: `Network error calling Gemini: ${err}` }, { status: 500 });
  }

  if (!geminiRes.ok) {
    const text = await geminiRes.text();
    return NextResponse.json({ error: `Gemini API error (${geminiRes.status}): ${text}` }, { status: 500 });
  }

  const geminiData = await geminiRes.json();
  let raw: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip markdown fences if present
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsedObj: { gpa?: number | null; courses: { code: string; grade: string; credits: number; term?: string }[] };
  try {
    const parsed = JSON.parse(raw);
    // Support both the new { gpa, courses } format and the legacy plain array
    if (Array.isArray(parsed)) {
      parsedObj = { gpa: null, courses: parsed };
    } else if (parsed && Array.isArray(parsed.courses)) {
      parsedObj = parsed;
    } else {
      throw new Error("Unexpected format");
    }
  } catch {
    return NextResponse.json({ error: "Could not parse AI response. Try a clearer scan.", raw }, { status: 500 });
  }

  const courses = parsedObj.courses
    .filter((c) => c.code && c.grade)
    .map((c) => ({
      code: norm(c.code),
      grade: normalizeGrade(c.grade),
      credits: typeof c.credits === "number" ? c.credits : parseInt(String(c.credits), 10) || 3,
      term: c.term ?? undefined,
    }));

  const gpa =
    typeof parsedObj.gpa === "number" && parsedObj.gpa > 0 && parsedObj.gpa <= 4.0
      ? Math.round(parsedObj.gpa * 100) / 100
      : null;

  return NextResponse.json({ courses, gpa });
}
