# The Advising Place — Product & Build Plan (AAMU MVP)

*End-to-end plan from a Product Manager's view: what we're building, why, and how — non-technical and technical. Scope: **all AAMU majors**, with **our own AI model from the start.***

---

## 0. The plan in one paragraph

We **launch in one month** with **our own transcript-reading AI model**, **accounts**, **saved plans**, and the planner working for **Computer Science plus a few popular majors**. Then we **add the rest of AAMU's majors in weekly waves** until every major is covered. Because we have no real transcripts yet, we bootstrap our model with **synthetic transcripts generated from AAMU's own catalog**, then improve it on real ones. The graduation planner stays rule-based so it's always reliable.

---

## 1. Decisions we're building on

| Decision | Choice |
|---|---|
| First release scope | **All AAMU majors** |
| Student sign-in | Email / Google login |
| Our own AI model | **Built from the start** (bootstrapped with synthetic data) |
| First school | Alabama A&M University (AAMU) |
| Timeline | **1 month to launch, then weekly waves to all majors** |

---

## 🚀 Launch strategy: 1 month, then waves

We launch fast, then grow coverage. The key insight that makes this clean:

**Our AI reader and the product are complete at launch — only the per-major planning data rolls out in waves.**

- **The AI model reads *any* AAMU transcript from day one.** Reading a transcript just means pulling out courses, grades, and terms — that's the same regardless of major. So the model is launch-complete, not phased.
- **Accounts, saving, and the planner engine are also launch-complete.**
- **What rolls out in waves is the requirements data per major** — the "what you still need to graduate" rules. We launch with CS + a few majors fully planned, then add ~5–8 more majors each week until all ~41 are covered.

So every student can sign up and read their transcript on day one; the list of fully-plannable majors grows each week. Majors not yet live show "coming soon — your transcript is saved."

---

# PART A — The Non-Technical Plan

## 2. Who it's for

- **Primary:** AAMU students — any major.
- **Later:** advisors (to guide faster) and an internal data team (to maintain the catalog).

## 3. What the student can do

- Sign up / log in.
- Pick **any AAMU major**.
- Upload a transcript → our AI reads it → review & edit.
- Get a correct semester-by-semester plan to graduation.
- See retakes flagged and counted.
- Save plans, reopen them, try a different major.

## 4. MVP scope — in and out

**In (at launch, month 1):**
- Accounts (email / Google)
- Our own AI transcript reader (works for **all** majors immediately)
- Planner live for **CS + a few popular majors**
- Upload → review → generate → save
- "My Plans" dashboard

**In (weekly waves after launch):**
- The remaining AAMU majors, added ~5–8 per week until all ~41 are live

**Out (later):**
- Advising chatbot
- Mobile app
- Other universities

## 5. How we'll measure success

- Accounts created
- Plans generated and saved
- Wizard completion rate
- **Our model's read accuracy** (how often students must correct it)
- **Majors live** (grows each week toward all ~41)
- Time to first plan (target under 3 minutes)

## 6. Risks and how we handle them

| Risk | Plan |
|---|---|
| Entering all majors is slow | Reusable rules engine (majors = data, not code) + AI-assisted extraction from the bulletin + human checks |
| Our own model isn't accurate enough at launch | Train on lots of **synthetic** transcripts first; keep a simple manual-entry path as backup; improve weekly on real data |
| Timeline pressure | Roll out majors in waves; accounts + saving + model are the must-haves |
| Sensitive student data | Privacy-first: encryption, minimal data, clear consent |

## 7. Launch (AAMU)

Soft launch to a small student group, gather a week of feedback, fix the top issues, then open to the whole campus.

---

# PART B — The Technical Plan

## 8. System design (MVP)

```
        Student's browser / phone
                 │
        ┌────────▼─────────┐
        │   Web app        │  Next.js
        │  pages + wizard  │
        └───┬───────┬───────┘
            │       │
     login  │       │  save/load, generate, read transcript
            ▼       ▼
   ┌────────────┐  ┌──────────────────────────────┐
   │ Auth        │  │  App's API (server)           │
   │ (email/     │  │  - plans (save/load)          │
   │  Google)    │  │  - majors & courses (read)    │
   └────────────┘  │  - transcript read            │
                    └───────┬───────────┬───────────┘
                            ▼           ▼
                  ┌────────────┐   ┌────────────────────┐
                  │ Database    │   │ Our AI model        │
                  │ majors,     │   │ (transcript reader) │
                  │ courses,    │   │ served as a service │
                  │ plans, etc. │   └─────────┬──────────┘
                  └────────────┘             ▲
                            ▲                 │ trained on
                    File storage        synthetic + real
                   (transcripts)        transcripts
```

Three new things vs. today: a **database**, **accounts**, and **our own AI model service** (plus a **rules engine** inside the app).

## 9. Our own AI model — how we build it from the start

The challenge: a model needs data to learn from, and we have no real transcripts yet. The solution: **make our own data.**

**Step 1 — Generate synthetic transcripts.**
We already have AAMU's full catalog (every course, credit, term, grade scale). We write a generator that produces **thousands of realistic student transcripts**: different majors, GPAs, transfer credits, failed/retaken classes, and term sequences.

**Step 2 — Make them look real.**
Render those transcripts into varied visual formats — different layouts, fonts, and "scanned/photographed" looks — so the model learns to read messy real-world documents, not just clean text.

**Step 3 — Train our model.**
Fine-tune an open base model on these (document → structured data) pairs. The output is our own transcript-reading model.

**Step 4 — Test it.**
Check accuracy on held-out synthetic transcripts plus a small set of **real** transcripts (from the team and volunteers).

**Step 5 — Serve it.**
Plug it into the app behind the same upload endpoint we already have (it's isolated, so this is a clean swap).

**Step 6 — Improve forever.**
With consent, real student transcripts + the corrections students make become new training data. The model gets better every week.

*The planner stays rule-based — only the reading (and later, a chatbot) is AI.*

## 10. The rules engine (supports all majors)

So we don't rewrite code for 41 majors, we build one **requirements engine**: give it a student's completed courses + their major, it returns "what's still needed." Each major is then **just data**.

It handles real rules:
- Required courses.
- "Choose one of these."
- Group requirements ("two history classes from this list").
- Prerequisites with AND/OR ("CS 215 **and** (CS 203 **or** CS 209)").

The existing scheduler plans from the engine's output.

## 11. Getting all majors' data in (the "mini data factory")

Entering ~41 majors by hand is the long pole. We speed it up the same way we'll scale later:
1. Feed each major's bulletin pages to AI → it drafts the requirements and prerequisites.
2. A human verifies and corrects.
3. It goes into the database in our standard format.

This doubles as practice for the future multi-school "data factory."

## 12. Data model (what the database stores)

**Catalog:** `majors`, `courses`, `prerequisites` (with AND/OR), `requirements`, `requirement_courses`.
**Student (private):** `users`, `transcripts`, `transcript_entries`, `plans`, `plan_semesters`, `plan_courses`.
*(Tagged so adding more universities later is easy.)*

## 13. Main functions / modules

- **Auth** — sign up / log in / out (email + Google).
- **Persistence** — save, list, load, delete plans.
- **Requirements engine** — "what's left for this major."
- **Scheduler** (exists) — extend for the engine + AND/OR prerequisites.
- **AI model service** — our transcript reader (synthetic-trained).
- **Synthetic data generator** — makes training transcripts from the catalog.
- **Catalog import tool** — AI-assisted major ingestion + human review.
- **Dashboard** — "My Plans."

## 14. API endpoints (MVP)

- Auth via an auth library (sign in / out, session).
- `GET /api/majors`, `GET /api/majors/:id` — majors + requirements.
- `GET /api/courses` — catalog.
- `POST /api/transcripts` — upload + read (our model).
- `GET / POST / PATCH / DELETE /api/plans` — manage plans.
- `POST /api/plans/:id/generate` — build the schedule.

## 15. Requirements checklist

**Functional — a student can:**
1. Create an account and log in.
2. Pick any AAMU major.
3. Upload a transcript and review/edit what our model read.
4. Generate a correct, prerequisite-safe plan.
5. See retakes flagged and counted.
6. Save, reopen, rename, delete plans.
7. Switch majors.

**Non-functional:**
- **Reliable** plans (rule-based).
- **Fast** (plan in under ~3 min).
- **Private & secure** (encryption, minimal data, consent).
- **Mobile-friendly** and **accessible**.
- **Model accuracy** tracked and improving.

---

# PART C — The Build Plan

## Phase 1 — The 1-month launch sprint (3 parallel tracks)

Three tracks run at the same time. Roles are a suggestion for you (Founder/PM), Smit, and Sirshak — plus AI help for the data work.

### Track 1 — Product (app, accounts, saving)
| Week | Work |
|---|---|
| 1 | Database + accounts (email/Google login) |
| 2 | Save / load / list plans; "My Plans" dashboard |
| 3 | Rules engine + AND/OR prerequisites; major-picker (with "coming soon" majors) |
| 4 | Polish, mobile, accessibility, QA |

### Track 2 — Our AI model (works for all majors at launch)
| Week | Work |
|---|---|
| 1 | Synthetic transcript generator from the catalog |
| 2 | Render varied/realistic versions; assemble the training set |
| 3 | Fine-tune the model; evaluate on synthetic + a few real transcripts |
| 4 | Deploy behind the upload endpoint; set up the improvement loop |

### Track 3 — Launch majors' data
| Week | Work |
|---|---|
| 1 | Define the requirements data format; build the AI-assisted import tool |
| 2–3 | Enter + human-verify CS (done) and ~3–4 popular majors |
| 4 | Accuracy checks on the launch majors |

**Launch definition of done:** a student can sign up, upload a transcript that **our own model** reads, pick CS or one of the launch majors, get a correct saved plan, and return to it later — live.

## Phase 2 — Weekly major waves (after launch)

Track 3 keeps running: each week, add **~5–8 more AAMU majors** (AI-assisted draft → human verify → publish), until **all ~41 majors** are live — roughly 5–6 weeks. The model, accounts, and planner don't change; we're only adding requirements data.

| Wave | Majors added | Cumulative |
|---|---|---|
| Launch | CS + ~4 | ~5 |
| Week +1 | ~7 | ~12 |
| Week +2 | ~7 | ~19 |
| Week +3 | ~7 | ~26 |
| Week +4 | ~7 | ~33 |
| Week +5 | ~8 | **all ~41** |

---

## 16. After the MVP

1. Advising chatbot for student questions.
2. Expand to other universities (reuse the data factory + model).
3. Mobile app.
4. Transfer-credit matching across schools.

---

*Living document — update it as we learn from the build and from real students.*
