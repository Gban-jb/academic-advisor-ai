"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Listing {
  id: string;
  term: string;
  company: string;
  title: string;
  category: string;
  url: string;
  companyUrl: string | null;
  locations: string[];
  postedAt: string | null;
}

interface Facet {
  term?: string;
  category?: string;
  count: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  "Software Engineering": "bg-blue-50 text-blue-700 border-blue-100",
  "AI / ML / Data": "bg-violet-50 text-violet-700 border-violet-100",
  "Quant Finance": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Product Management": "bg-amber-50 text-amber-700 border-amber-100",
  Hardware: "bg-rose-50 text-rose-700 border-rose-100",
};

function postedLabel(iso: string | null): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function InternshipsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [terms, setTerms] = useState<Facet[]>([]);
  const [categories, setCategories] = useState<Facet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const firstLoad = useRef(true);

  // Debounce typing so each keystroke isn't a query.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(nextPage) });
        if (term) params.set("term", term);
        if (category) params.set("category", category);
        if (search) params.set("q", search);

        const res = await fetch(`/api/internships?${params}`);
        const d = await res.json();
        setListings((prev) => (append ? [...prev, ...d.listings] : d.listings));
        setTotal(d.total);
        setTerms(d.terms ?? []);
        setCategories(d.categories ?? []);
        setSyncedAt(d.syncedAt ?? null);
      } catch {
        if (!append) setListings([]);
      } finally {
        setLoading(false);
        firstLoad.current = false;
      }
    },
    [term, category, search]
  );

  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <a href="/" className="mb-6 inline-block text-sm text-slate-500 transition-colors hover:text-maroon-700">
          ← Back
        </a>
        <h1 className="text-2xl font-bold tracking-tight text-maroon-900 sm:text-3xl">
          Internships for CS students
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Software engineering, AI/ML, quant, product and hardware internships that are
          open right now — upcoming terms only, so nothing here has already passed.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Sourced from{" "}
          <a
            href="https://github.com/SimplifyJobs/Summer2027-Internships"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-maroon-700"
          >
            SimplifyJobs / Summer2027-Internships
          </a>
          , maintained by Simplify and Pitt CSC.
          {syncedAt && ` Updated ${postedLabel(syncedAt) || "just now"}.`}
        </p>
      </header>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, role or location…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
        />

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === ""} onClick={() => setCategory("")}>
            All roles
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.category}
              active={category === c.category}
              onClick={() => setCategory(c.category!)}
            >
              {c.category} <span className="opacity-50">{c.count}</span>
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={term === ""} onClick={() => setTerm("")}>
            All terms
          </FilterChip>
          {terms.map((t) => (
            <FilterChip key={t.term} active={term === t.term} onClick={() => setTerm(t.term!)}>
              {t.term} <span className="opacity-50">{t.count}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-400">
        {loading && firstLoad.current ? "Loading…" : `${total.toLocaleString()} openings`}
      </p>

      {/* Listings */}
      <div className="space-y-2">
        {listings.map((l, i) => (
          <motion.a
            key={`${l.id}-${l.term}`}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.02 }}
            className="group flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-maroon-200"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">{l.company}</span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                    CATEGORY_STYLES[l.category] ?? "bg-slate-50 text-slate-600 border-slate-100"
                  }`}
                >
                  {l.category}
                </span>
                <span className="text-[10px] text-slate-400">{l.term}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{l.title}</p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {l.locations.length ? l.locations.slice(0, 3).join(" · ") : "Location not listed"}
                {l.locations.length > 3 && ` +${l.locations.length - 3}`}
                {l.postedAt && ` — posted ${postedLabel(l.postedAt)}`}
              </p>
            </div>
            <span className="shrink-0 self-center rounded-lg bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-maroon-800">
              Apply →
            </span>
          </motion.a>
        ))}
      </div>

      {!loading && listings.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No openings match that search.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("");
              setTerm("");
            }}
            className="mt-3 text-sm text-maroon-700 underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {listings.length < total && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              load(nextPage, true);
            }}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-maroon-300 hover:text-maroon-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : `Show more (${total - listings.length} left)`}
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-slate-400">
        Listings link straight to each company&apos;s application page. We don&apos;t
        collect applications or store anything about you here.
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-maroon-300 bg-maroon-50 text-maroon-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-maroon-200"
      }`}
    >
      {children}
    </button>
  );
}
