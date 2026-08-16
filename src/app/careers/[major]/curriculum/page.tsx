import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAJOR_CAREERS } from "@/lib/careers";
import {
  CURRICULA,
  hasInteractivePlanner,
  type CoursePick,
  type Semester,
  type Year,
} from "@/lib/curricula";

interface Props {
  params: { major: string };
}

export function generateStaticParams() {
  return Object.keys(CURRICULA).map((major) => ({ major }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = CURRICULA[params.major];
  if (!c) return { title: "Curriculum · The Advising Place" };
  return {
    title: `${c.major} — Sample 4-year plan · The Advising Place`,
    description: `The AAMU Undergraduate Bulletin's recommended graduation sequence for ${c.major}.`,
  };
}

function CourseRow({ course }: { course: CoursePick }) {
  const isPlaceholder = !course.code;
  const creditText =
    course.credits === 0
      ? course.note?.match(/\d+[–-]\d+/)?.[0] ?? "0–3"
      : String(course.credits);

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="w-20 py-2 pr-2 align-top">
        {course.code ? (
          <span className="rounded bg-maroon-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-maroon-800">
            {course.code}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-slate-300">Choice</span>
        )}
      </td>
      <td className="py-2 pr-2 align-top">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={`text-sm ${
              isPlaceholder ? "text-slate-500" : "font-medium text-slate-800"
            }`}
          >
            {course.title}
          </span>
          {course.minC && (
            <span
              title="A grade of C or better is required to progress"
              className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700"
            >
              Min C
            </span>
          )}
          {course.capstone && (
            <span
              title="Capstone course — cannot be substituted"
              className="rounded bg-maroon-700 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
            >
              Capstone
            </span>
          )}
        </div>
        {course.note && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{course.note}</p>
        )}
      </td>
      <td className="w-10 py-2 pl-2 text-right align-top font-mono text-xs text-slate-600">
        {creditText}
      </td>
    </tr>
  );
}

function SemesterCard({ semester }: { semester: Semester }) {
  const total = semester.creditsRange
    ? `${semester.creditsRange[0]}–${semester.creditsRange[1]}`
    : String(semester.credits);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {semester.label}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-maroon-800 shadow-sm">
          {total} cr
        </span>
      </header>
      <table className="w-full flex-1">
        <tbody>
          {semester.courses.map((c, i) => (
            <CourseRow key={i} course={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearBlock({ year }: { year: Year }) {
  const total = year.semesters.reduce((sum, s) => sum + s.credits, 0);
  return (
    <section className="scroll-mt-20">
      <header className="mb-3 flex items-baseline justify-between border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-maroon-900 sm:text-xl">{year.label}</h2>
        <span className="text-xs text-slate-400">≈ {total} credits this year</span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {year.semesters.map((s) => (
          <SemesterCard key={s.label} semester={s} />
        ))}
      </div>
    </section>
  );
}

export default function CurriculumPage({ params }: Props) {
  const c = CURRICULA[params.major];
  if (!c) notFound();

  const careerLink = MAJOR_CAREERS.find((m) => m.slug === c.slug);
  const interactive = hasInteractivePlanner(c.slug);
  const totalCredits = c.years
    .flatMap((y) => y.semesters.map((s) => s.credits))
    .reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <a
        href={`/careers/${c.slug}`}
        className="mb-6 inline-block text-sm text-slate-500 transition-colors hover:text-maroon-700"
      >
        ← {c.major} careers
      </a>

      {/* Hero */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#b8860b" }}
          >
            Sample 4-year plan · AAMU Bulletin 2026–2027
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-maroon-900 sm:text-4xl">
            {c.major}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            The bulletin&apos;s recommended semester-by-semester sequence — transcribed
            straight from page {c.bulletinPage}. It sums to {c.totalCredits} credits
            across four years.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {c.totalCredits} total credits
          </span>
          {interactive ? (
            <a
              href="/planner"
              className="rounded-xl bg-maroon-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
            >
              Open interactive planner →
            </a>
          ) : (
            <span
              title="Interactive planner requires full course + prereq data — coming next"
              className="cursor-default rounded-xl border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-400"
            >
              Interactive planner coming soon
            </span>
          )}
        </div>
      </header>

      {/* Year jump strip */}
      <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {c.years.map((y) => (
          <a
            key={y.label}
            href={`#${y.label.replace(/\s+/g, "-").toLowerCase()}`}
            className="transition-colors hover:text-maroon-700"
          >
            {y.label}
          </a>
        ))}
        {c.concentrations && c.concentrations.length > 0 && (
          <a href="#concentrations" className="transition-colors hover:text-maroon-700">
            Concentrations
          </a>
        )}
        <a href="#notes" className="transition-colors hover:text-maroon-700">
          Notes
        </a>
      </nav>

      {/* Years */}
      <div className="space-y-10">
        {c.years.map((y) => (
          <div key={y.label} id={y.label.replace(/\s+/g, "-").toLowerCase()}>
            <YearBlock year={y} />
          </div>
        ))}
      </div>

      {/* Concentrations */}
      {c.concentrations && c.concentrations.length > 0 && (
        <section id="concentrations" className="mt-14 scroll-mt-20">
          <header className="mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-maroon-900 sm:text-xl">Concentrations</h2>
            <p className="mt-1 text-xs text-slate-400">
              Pick one concentration and fold its courses into the year-by-year plan above.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {c.concentrations.map((conc) => (
              <div
                key={conc.slug}
                className="overflow-hidden rounded-2xl border border-maroon-100 bg-gradient-to-br from-maroon-50/50 to-white shadow-sm"
              >
                <header className="border-b border-maroon-100 bg-white/60 px-4 py-3">
                  <p className="text-sm font-bold text-maroon-900">{conc.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{conc.totalCredits}</p>
                </header>
                <table className="w-full">
                  <tbody>
                    {conc.courses.map((course, i) => (
                      <CourseRow key={i} course={course} />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      <section id="notes" className="mt-14 scroll-mt-20">
        <header className="mb-3 border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-maroon-900 sm:text-xl">Program notes</h2>
        </header>
        <ul className="space-y-2">
          {c.notes.map((note, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs leading-relaxed text-slate-600"
            >
              <span className="mt-0.5 shrink-0" style={{ color: "#b8860b" }} aria-hidden>
                ✦
              </span>
              {note}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
        <span>
          Transcribed from AAMU Undergraduate Bulletin 2026–2027, p.{c.bulletinPage}. Table
          sum: <strong className="font-mono text-slate-700">{totalCredits}</strong> credits
          (bulletin lists {c.totalCredits}).
        </span>
        {careerLink && (
          <a
            href={`/careers/${c.slug}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 transition-colors hover:border-maroon-200 hover:text-maroon-700"
          >
            See career paths →
          </a>
        )}
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
        The bulletin is the source of record — the version on{" "}
        <a
          href="https://www.aamu.edu"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-maroon-700"
        >
          aamu.edu
        </a>{" "}
        takes precedence over anything shown here. Confirm requirements with your advisor
        before registration.
      </p>
    </div>
  );
}
