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
  degrees: string[];
  sponsorship: string | null;
  postedAt: string | null;
  sourceUpdatedAt?: string | null;
  stillListed?: boolean;
  savedAt?: string;
}

interface Facet {
  term?: string;
  category?: string;
  degree?: string;
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
  const [degrees, setDegrees] = useState<Facet[]>([]);
  const [degree, setDegree] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const [authed, setAuthed] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savedList, setSavedList] = useState<Listing[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const keyOf = (l: { id: string; term: string }) => `${l.id}::${l.term}`;

  const refreshSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/internships/saved");
      if (!res.ok) return;
      const d = await res.json();
      setSavedList(d.saved);
      setSavedKeys(new Set(d.saved.map((x: Listing) => `${x.id}::${x.term}`)));
    } catch {
      /* saved state is a nicety; the board still works without it */
    }
  }, []);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(Boolean(d.authenticated));
        if (d.authenticated) refreshSaved();
      })
      .catch(() => {});
  }, [refreshSaved]);

  async function toggleSave(l: Listing) {
    const key = keyOf(l);
    const saved = savedKeys.has(key);

    // Optimistic — a bookmark that lags behind the click feels broken.
    setSavedKeys((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      const res = saved
        ? await fetch(
            `/api/internships/saved?id=${encodeURIComponent(l.id)}&term=${encodeURIComponent(l.term)}`,
            { method: "DELETE" }
          )
        : await fetch("/api/internships/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: l.id, term: l.term }),
          });
      if (!res.ok) throw new Error(String(res.status));
      refreshSaved();
    } catch {
      setSavedKeys((prev) => {
        const next = new Set(prev);
        if (saved) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  }

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
        if (degree) params.set("degree", degree);

        const res = await fetch(`/api/internships?${params}`);
        const d = await res.json();
        setListings((prev) => (append ? [...prev, ...d.listings] : d.listings));
        setTotal(d.total);
        setTerms(d.terms ?? []);
        setCategories(d.categories ?? []);
        setDegrees(d.degrees ?? []);
        setSyncedAt(d.syncedAt ?? null);
      } catch {
        if (!append) setListings([]);
      } finally {
        setLoading(false);
        firstLoad.current = false;
      }
    },
    [term, category, search, degree]
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

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-400">Open to</span>
          <FilterChip active={degree === ""} onClick={() => setDegree("")}>
            Any degree
          </FilterChip>
          {degrees.map((d) => (
            <FilterChip
              key={d.degree}
              active={degree === d.degree}
              onClick={() => setDegree(d.degree!)}
            >
              {d.degree} <span className="opacity-50">{d.count}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {showSaved
            ? `${savedList.length} saved`
            : loading && firstLoad.current
              ? "Loading…"
              : `${total.toLocaleString()} openings`}
        </p>
        {authed ? (
          <button
            onClick={() => setShowSaved((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              showSaved
                ? "border-maroon-300 bg-maroon-50 text-maroon-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-maroon-200"
            }`}
          >
            {showSaved ? "← All openings" : `★ Saved (${savedKeys.size})`}
          </button>
        ) : (
          <a
            href="/login?next=%2Finternships"
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-maroon-700"
          >
            Sign in to save listings
          </a>
        )}
      </div>

      {/* Listings */}
      <div className="space-y-2">
        {(showSaved ? savedList : listings).map((l, i) => (
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
                {l.sourceUpdatedAt && `, updated ${postedLabel(l.sourceUpdatedAt)}`}
              </p>

              {showSaved && l.stillListed === false && (
                <p className="mt-1.5 text-xs text-amber-700">
                  No longer listed — this posting has closed or been filled.
                </p>
              )}

              {(l.degrees.length > 0 || l.sponsorship) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {l.degrees.map((d) => (
                    <span
                      key={d}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
                    >
                      {d}
                    </span>
                  ))}
                  {l.sponsorship && (
                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      ⚠ {l.sponsorship}
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-2 self-center">
              {authed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSave(l);
                  }}
                  aria-label={savedKeys.has(keyOf(l)) ? "Remove from saved" : "Save this listing"}
                  title={savedKeys.has(keyOf(l)) ? "Saved — click to remove" : "Save"}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                    savedKeys.has(keyOf(l))
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-400 hover:border-maroon-200 hover:text-maroon-700"
                  }`}
                >
                  {savedKeys.has(keyOf(l)) ? "★" : "☆"}
                </button>
              )}
              <span className="rounded-lg bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-maroon-800">
                Apply →
              </span>
            </span>
          </motion.a>
        ))}
      </div>

      {showSaved && savedList.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">You haven&apos;t saved any listings yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Tap ☆ on any opening to keep it here.
          </p>
        </div>
      )}

      {!showSaved && !loading && listings.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No openings match that search.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("");
              setTerm("");
              setDegree("");
            }}
            className="mt-3 text-sm text-maroon-700 underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {!showSaved && listings.length < total && (
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

      <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-slate-400">
        Postings are removed as soon as they stop accepting applications, so
        everything here is still open — the source doesn&apos;t publish closing
        dates, which is why you see when a role was posted and last updated
        instead of a deadline. Listings link straight to each company&apos;s
        application page; we don&apos;t collect applications or store anything
        about you here.
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
