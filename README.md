# The Advising Place

A degree planner for Alabama A&M University Computer Science students. Upload a
transcript, and it works out which courses to take each semester — prerequisites
checked, credits balanced — all the way to graduation.

**Live:** https://advisingplace.com

---

## What it does

- **Reads a transcript.** Upload a PDF or photo; Gemini extracts the courses and
  grades. Passing grades count toward the degree; D/F/W are flagged for retake.
- **Builds a semester-by-semester plan.** A prerequisite-aware scheduler lays out
  every remaining course against the 125-credit BS Computer Science requirements,
  aligned to the AAMU 2025–2026 Bulletin.
- **Answers questions.** An AI advisor and chatbot with the course catalog in
  context, backed by retrieval over the bulletin.
- **Saves your work.** Plans persist per student, so closing the tab loses nothing.
- **Keeps several plans.** Name them, duplicate one to try a different
  concentration or credit load, and switch between them — comparing paths no
  longer means destroying the one you already built.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| UI | Tailwind CSS, framer-motion |
| Database | Neon Postgres (`@neondatabase/serverless`) |
| Auth | Custom magic link — `jose` JWTs, email via Resend |
| AI | Gemini (transcript OCR), OpenAI (advisor + chat), Pinecone (retrieval) |
| Hosting | Vercel, auto-deploying from `main` |

---

## Authentication

Sign-in is a magic link — no passwords. Two rules govern it:

**Only `@bulldogs.aamu.edu` and `@gmail.com` addresses may sign in.** The list
lives in `ALLOWED_DOMAINS` in [`src/lib/auth.ts`](src/lib/auth.ts) and is enforced
when the link is issued *and* again when it's redeemed, so a link issued before a
rule change can't be redeemed after one.

**The site is public; only some of it needs an account.** Browsing the landing
page and course catalog requires nothing. A session is required for the planner,
the Banner dashboard, the printable report, and every API route that spends money
or touches personal data. The gated list is `PROTECTED_PREFIXES` in
[`src/middleware.ts`](src/middleware.ts).

Protected API routes call `requireSession()` themselves rather than trusting the
middleware — they reach OpenAI, Gemini and Pinecone, and must not be callable by
an anonymous client.

### Cross-device sign-in

Cookies belong to one browser on one device, so a link opened on your phone can't
sign in your laptop directly. Instead the tab that requested the link polls
`/api/magic-link/poll`; opening the link anywhere marks the request approved, and
the waiting tab claims it and receives the session. Opening a link with no pending
request still signs in whichever device opened it.

---

## Local setup

```bash
npm install
```

Create `.env.local` (see below), then set up the database tables:

```bash
node --env-file=.env.local scripts/init-db.mjs
```

```bash
npm run dev
```

The app runs at http://localhost:3000.

### Environment variables

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs magic-link and session JWTs. Any long random string. |
| `AUTH_URL` | Base URL used to build links in emails (e.g. `https://advisingplace.com`). |
| `AUTH_RESEND_KEY` | Resend API key for sending sign-in emails. |
| `AUTH_EMAIL_FROM` | Sender address, e.g. `AAMU Degree Planner <login@advisingplace.com>`. |
| `DATABASE_URL` | Neon Postgres connection string. |
| `GEMINI_API_KEY` | Transcript extraction. |
| `OPENAI_API_KEY` | Advisor and chatbot. |
| `PINECONE_API_KEY`, `PINECONE_HOST`, `PINECONE_INDEX_NAME` | Retrieval over the bulletin. |
| `SCRAPER_URL` | Banner scraper service (Railway). |

Sending email to real recipients needs a domain verified at
[resend.com/domains](https://resend.com/domains) with `AUTH_EMAIL_FROM` pointed at
it. Without one, Resend's sandbox only delivers to the account owner's address.

---

## Database

Three tables, created by `scripts/init-db.mjs` (safe to re-run):

| Table | Holds |
|---|---|
| `plans` | Named plans, many per student (`id` primary key, indexed by email). |
| `login_requests` | Pending sign-ins, so a link opened elsewhere can release the waiting tab. |
| `rate_limits` | Fixed-window counters for the public API. |

`users`, `accounts`, `sessions` and `verification_tokens` are leftovers from an
earlier NextAuth setup and are no longer used.

---

## Project structure

```
src/
  app/
    page.tsx              Landing + AAMU detail (public)
    planner/              The planner wizard (requires sign-in)
    banner/               Banner SSB dashboard (requires sign-in)
    login/                Magic-link sign-in
    api/
      magic-link/         send · verify · poll · logout
      plans/              List, create, duplicate, rename, delete, load and save
      advise/ chat/       AI advisor and chatbot
      extract-transcript/ Transcript OCR
      course-info/        Course descriptions (public, rate limited)
      banner/             Proxy to the Banner scraper
  components/             Welcome, UniversityDetail, Planner, wizard steps
  lib/
    data.ts               Course catalog, grade rules, degree requirements
    scheduler.ts          Prerequisite-aware semester builder
    auth.ts               Domain rule, token signing and verification
    api-auth.ts           requireSession() for route handlers
    db.ts                 Neon client
    rate-limit.ts         Postgres-backed rate limiting
scraper-server/           Banner scraper (deployed separately to Railway)
scripts/init-db.mjs       Database setup
```

---

## Deployment

Pushing to `main` deploys to production on Vercel. `vercel.json` pins the Next.js
framework preset. DNS lives at Cloudflare; `advisingplace.com` is canonical and
every other hostname 308-redirects to it (see `CANONICAL_HOST` in
[`src/middleware.ts`](src/middleware.ts)).

---

## Known limitations

- **Email to `@bulldogs.aamu.edu` is unreliable.** AAMU runs Microsoft 365, which
  quarantines mail from newly registered domains regardless of SPF/DKIM/DMARC
  passing. The fix is asking AAMU IT to allowlist `advisingplace.com`; Gmail
  sign-in works today.
- **No side-by-side comparison.** Students can keep multiple plans and switch
  between them, but nothing yet lays two plans against each other to show which
  graduates sooner. Up to 20 plans per student.
- `/api/course-info` is public and rate limited to 60 requests/hour per IP; every
  other AI endpoint requires a session.
