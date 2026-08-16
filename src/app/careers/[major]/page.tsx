import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CAREER_SECTIONS,
  FIELD_LABELS,
  MAJOR_CAREERS,
  type CareerLink,
} from "@/lib/careers";
import { hasCurriculum, hasInteractivePlanner, interactivePlannerHref } from "@/lib/curricula";

interface Props {
  params: { major: string };
}

/** Pre-render all 20 majors — the content is static, so there's no reason not to. */
export function generateStaticParams() {
  return MAJOR_CAREERS.map((m) => ({ major: m.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const m = MAJOR_CAREERS.find((x) => x.slug === params.major);
  if (!m) return { title: "Careers · The Advising Place" };
  return {
    title: `${m.major} careers · The Advising Place`,
    description: m.summary,
  };
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function MajorCareerPage({ params }: Props) {
  const major = MAJOR_CAREERS.find((m) => m.slug === params.major);
  if (!major) notFound();

  // The field-tagged opportunities that apply to this major.
  const relevant = CAREER_SECTIONS.map((s) => ({
    ...s,
    links: s.links.filter(
      (l: CareerLink) => l.fields === "all" || l.fields.includes(major.field)
    ),
  })).filter((s) => s.links.length > 0);

  const onet = `https://www.onetonline.org/find/quick?s=${encodeURIComponent(major.onetQuery)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <a
        href="/careers"
        className="mb-6 inline-block text-sm text-slate-500 transition-colors hover:text-maroon-700"
      >
        ← All majors
      </a>

      {/* Hero */}
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#b8860b" }}>
          {FIELD_LABELS[major.field]} · Career paths
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-maroon-900 sm:text-4xl">
          {major.major}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {major.summary}
        </p>

        {(hasInteractivePlanner(major.slug) || hasCurriculum(major.slug)) && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              🎓 Graduation planning
            </span>
            {hasInteractivePlanner(major.slug) && (
              <a
                href={interactivePlannerHref(major.slug)}
                className="rounded-lg bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-maroon-800"
              >
                Open interactive planner →
              </a>
            )}
            {hasCurriculum(major.slug) && (
              <a
                href={`/careers/${major.slug}/curriculum`}
                className="rounded-lg border border-maroon-200 bg-white px-3 py-1.5 text-xs font-medium text-maroon-800 transition-colors hover:bg-maroon-50"
              >
                {hasInteractivePlanner(major.slug)
                  ? "View 4-year sample plan"
                  : "View 4-year sample plan from Bulletin"}
              </a>
            )}
          </div>
        )}
      </header>

      {/* Roles */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Where this degree leads</h2>
        <div className="flex flex-wrap gap-2">
          {major.roles.map((r) => (
            <span
              key={r}
              className="rounded-full border border-maroon-100 bg-maroon-50/60 px-3 py-1.5 text-xs font-medium text-maroon-900"
            >
              {r}
            </span>
          ))}
        </div>
        <a
          href={onet}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-slate-400 underline underline-offset-2 transition-colors hover:text-maroon-700"
        >
          See pay and job outlook for these roles on O*NET ↗
        </a>
      </section>

      {/* Build + employers */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Panel title="What to build before you graduate" icon="🛠️">
          <ul className="space-y-2">
            {major.build.map((b) => (
              <li key={b} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="mt-0.5 shrink-0" style={{ color: "#b8860b" }} aria-hidden>✦</span>
                {b}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Who hires Bulldogs from this major" icon="🏛️">
          <ul className="space-y-2">
            {major.employers.map((e) => (
              <li key={e} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="mt-0.5 shrink-0 text-maroon-400" aria-hidden>▸</span>
                {e}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Professional orgs */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-bold text-slate-900">
          🤝 Professional organizations worth joining
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {major.orgs.map((o) => (
            <a
              key={o.name}
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm transition-all hover:-translate-y-px hover:border-maroon-200 hover:shadow"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-800 group-hover:text-maroon-800">
                  {o.name}
                </span>
                {o.hbcu && (
                  <span className="mt-1 inline-block rounded bg-maroon-50 px-1.5 py-0.5 text-[10px] font-semibold text-maroon-800">
                    🐾 for Bulldogs
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-300 group-hover:text-maroon-500" aria-hidden>↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* Opportunities filtered to this major's field */}
      <section className="border-t border-slate-100 pt-8">
        <h2 className="mb-1 text-lg font-bold text-maroon-900">
          Opportunities open to {major.major} majors
        </h2>
        <p className="mb-6 text-xs text-slate-400">
          Filtered from our full list to what applies to {FIELD_LABELS[major.field]} students.
        </p>

        <div className="space-y-8">
          {relevant.map((section) => (
            <div key={section.id}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span aria-hidden>{section.icon}</span>
                {section.title}
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {section.links.map((l) => (
                  <a
                    key={l.name}
                    href={l.url}
                    target={l.internal ? undefined : "_blank"}
                    rel={l.internal ? undefined : "noopener noreferrer"}
                    className={`group flex flex-col rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      l.internal
                        ? "border-maroon-200 bg-gradient-to-br from-maroon-50/80 to-white"
                        : "border-slate-100 bg-white hover:border-maroon-200"
                    }`}
                  >
                    <span className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-maroon-800">
                        {l.name}
                      </span>
                      <span className="mt-0.5 shrink-0 text-xs text-slate-300 group-hover:text-maroon-500" aria-hidden>
                        {l.internal ? "→" : "↗"}
                      </span>
                    </span>
                    <span className="flex-1 text-xs leading-relaxed text-slate-500">{l.blurb}</span>
                    {l.hbcu && (
                      <span className="mt-3 inline-block w-fit rounded bg-maroon-50 px-1.5 py-0.5 text-[10px] font-semibold text-maroon-800">
                        🐾 for Bulldogs
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-12 border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-slate-400">
        Career paths are a starting point, not a limit — plenty of {major.major} graduates
        end up somewhere not listed here. Check deadlines and requirements on each
        organization&apos;s own site, and talk to{" "}
        <a
          href="https://www.aamu.edu/campus-life/student-support/career-development/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-maroon-700"
        >
          AAMU Career Development Services
        </a>
        .
      </p>
    </div>
  );
}
