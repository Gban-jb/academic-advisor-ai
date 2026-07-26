#!/usr/bin/env python3
"""
AAMU Full Course Catalog Scraper & RAG Builder
Extracts ALL courses from the 2026-2027 Undergraduate Bulletin (pages 225-364)
plus structured Gen Ed and CS program data, then uploads everything to Pinecone.

Usage:
  python build_full_rag_database.py                 # extract + upload
  python build_full_rag_database.py --extract-only  # extract, save JSON, no upload
  python build_full_rag_database.py --upload-only   # skip extraction, use saved JSON
  python build_full_rag_database.py --dry-run       # extract + print chunks, no upload
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

PDF_PATH = "/Users/jeebanbashyal/Desktop/AAMU Advising/new latest course catalog.pdf"
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
COURSES_JSON = DATA_DIR / "full_catalog_courses.json"
CHUNKS_JSON  = DATA_DIR / "full_catalog_chunks.json"

EMBEDDING_MODEL    = "text-embedding-3-small"
EMBEDDING_DIM      = 1536
BATCH_SIZE         = 50
COURSE_DESC_START  = 225   # first page of course descriptions
COURSE_DESC_END    = 364   # last page (inclusive)

# ── PDF extraction ─────────────────────────────────────────────────────────────

# Course-code pattern: "CS 101", "COMM 411", "CS 303L", "CMG 101"
# Optional cross-ref "(CS 519)" annotation before the title is allowed
COURSE_CODE_RE = re.compile(
    r'^([A-Z]{2,6})\s+(\d{3}[A-Z]{0,2})\s+((?:\([^)]+\)\s+)?[A-Z].+)$'
)

# Inline cross-reference numbers like "(CS 519)" at the start of a title
XREF_RE = re.compile(r'^\((?:[A-Z]{2,6}\s+)?\d{3}[A-Z]?\)\s*')

# Credit hours: "3 credit hours", "1-3 credit hours", "2 credit hours"
CREDIT_RE = re.compile(
    r'(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+credit\s+hours?', re.IGNORECASE
)

# Title separator before credit info
TITLE_SEP_RE = re.compile(r'\s+[–\-]\s+')

# Prerequisite
PREREQ_RE = re.compile(
    r'[Pp]rerequisites?:?\s*(.*?)(?=\s*(?:[Cc]orequisites?:|$))',
    re.DOTALL
)

# Corequisite
COREQ_RE = re.compile(
    r'[Cc]orequisites?:?\s*(.*?)(?:\.|$)',
    re.DOTALL
)

# Page header/footer patterns to skip
PAGE_HEADER_RE = re.compile(
    r'COURSE DESCRIPTIONS.*Bulletin|~\s*\d+\s*~|^\s*\d+\s*$',
    re.IGNORECASE
)


def extract_all_text(pdf_path: str) -> list[tuple[int, str]]:
    """Return list of (1-indexed page_num, page_text) for all pages."""
    import pdfplumber
    result = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"  PDF has {total} pages — reading pages {COURSE_DESC_START}–{COURSE_DESC_END}...")
        for i, page in enumerate(pdf.pages):
            page_num = i + 1
            if page_num < COURSE_DESC_START or page_num > COURSE_DESC_END:
                continue
            text = page.extract_text() or ""
            result.append((page_num, text))
            if page_num % 20 == 0:
                print(f"    Read up to page {page_num}...")
    return result


def is_page_noise(line: str) -> bool:
    """Return True for page headers, footers, and blank lines to skip."""
    s = line.strip()
    if not s:
        return True
    if PAGE_HEADER_RE.search(s):
        return True
    return False


def looks_like_subject_header(line: str) -> bool:
    """
    Detect centered subject-header lines like 'Computer Science',
    'Communicative Sciences & Disorders', 'Construction Management'.
    These appear between course groups in the catalog.
    """
    s = line.strip()
    if not s or len(s) > 60:
        return False
    # Must start with an uppercase letter (not lowercase continuation text)
    if not s[0].isupper():
        return False
    if COURSE_CODE_RE.match(s):
        return False
    # Reject lines with punctuation that only appears in descriptions/prereqs
    if re.search(r'[.!?:;()\[\]0-9–\-]', s):
        return False
    # Reject single common non-header words
    EXCLUDE = {'none', 'other', 'required', 'prerequisite', 'corequisite',
               'junior', 'senior', 'approved', 'consent', 'instructor', 'advisor',
               'standing', 'permission', 'note', 'students', 'student', 'grade'}
    if s.lower() in EXCLUDE:
        return False
    # Must be 1-6 words, all significant words title-case
    words = s.split()
    if len(words) > 6:
        return False
    minor = {"and", "of", "the", "in", "for", "to", "a", "an", "at", "by",
             "de", "w/", "&"}
    cap_words = [w for w in words if w.lower() not in minor]
    if not cap_words:
        return False
    return all(w[0].isupper() for w in cap_words)


def parse_courses(pages: list[tuple[int, str]]) -> list[dict]:
    """Parse all course entries from extracted page text."""
    # Flatten all lines with their page numbers
    all_lines: list[tuple[int, str]] = []
    for page_num, text in pages:
        for line in text.split("\n"):
            all_lines.append((page_num, line))

    courses: list[dict] = []
    current: Optional[dict] = None
    current_subject = "General"
    n = len(all_lines)

    i = 0
    while i < n:
        page_num, raw_line = all_lines[i]
        line = raw_line  # keep original spacing for code detection

        if is_page_noise(line):
            i += 1
            continue

        m = COURSE_CODE_RE.match(line.strip())
        if m:
            # Save previous course
            if current:
                courses.append(_finalize(current))

            prefix = m.group(1)
            number = m.group(2)
            rest   = m.group(3).strip()

            current = {
                "code":    f"{prefix} {number}",
                "prefix":  prefix,
                "number":  number,
                "subject": current_subject,
                "raw":     rest,
                "page":    page_num,
            }
        elif current is not None:
            stripped = line.strip()
            # Could this be a new subject header?
            if looks_like_subject_header(stripped):
                # Look ahead: within the next 8 non-empty lines, there must be
                # a course code (headers can be followed by parenthetical notes)
                j = i + 1
                non_empty_count = 0
                found_course = False
                while j < n and non_empty_count < 8:
                    nxt = all_lines[j][1].strip()
                    if nxt:
                        if COURSE_CODE_RE.match(nxt):
                            found_course = True
                            break
                        non_empty_count += 1
                    j += 1
                if found_course:
                    current_subject = stripped
                    # Don't skip to j — the intervening lines are notes, not
                    # course descriptions; just record the new subject and
                    # let the main loop consume those lines as continuations
                    # (they'll be skipped because current will be saved next)
                    if current:
                        courses.append(_finalize(current))
                    current = None
                    i += 1
                    continue
            # Continuation of current course description
            current["raw"] = current["raw"] + " " + stripped
        else:
            # Before any course — check for subject header
            stripped = line.strip()
            if looks_like_subject_header(stripped):
                current_subject = stripped
        i += 1

    if current:
        courses.append(_finalize(current))

    return courses


def _finalize(raw_course: dict) -> dict:
    """Parse raw accumulated text into structured course fields."""
    raw = raw_course["raw"].strip()

    # Remove cross-ref annotations like "(CS 519)" at start of title
    raw = XREF_RE.sub("", raw).strip()

    # Split title from "– N credit hours. Description..."
    sep_match = TITLE_SEP_RE.search(raw)
    if sep_match:
        title = raw[:sep_match.start()].strip()
        rest  = raw[sep_match.end():].strip()
    else:
        title = raw[:80].strip()
        rest  = raw

    # Extract credits
    credit_match = CREDIT_RE.search(rest)
    if credit_match:
        cs = credit_match.group(1).replace(" ", "")
        if "-" in cs:
            credits = float(cs.split("-")[0])
        else:
            credits = float(cs)
    else:
        credits = 3.0

    # Description: text after "N credit hours."
    desc_match = re.search(
        r'\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s+credit\s+hours?\.\s*(.*)',
        rest, re.DOTALL | re.IGNORECASE
    )
    description = desc_match.group(1).strip() if desc_match else rest.strip()

    # Extract prerequisite
    prereq_match = PREREQ_RE.search(description)
    prereqs_raw = prereq_match.group(1).strip() if prereq_match else "None"
    # Trim trailing period/whitespace
    prereqs_raw = re.sub(r'\s*\.\s*$', '', prereqs_raw).strip()

    # Extract corequisite
    coreq_match = COREQ_RE.search(description)
    coreqs_raw = coreq_match.group(1).strip() if coreq_match else None
    if coreqs_raw:
        coreqs_raw = re.sub(r'\s*\.\s*$', '', coreqs_raw).strip()

    # Clean description: remove prerequisite/corequisite tail
    clean_desc = description
    if prereq_match:
        clean_desc = description[:prereq_match.start()].strip()
    clean_desc = re.sub(r'\s*\.\s*$', '', clean_desc).strip()

    # Parse prerequisite course codes
    prereq_codes = re.findall(r'\b([A-Z]{2,6})\s+(\d{3}[A-Z]?)\b', prereqs_raw)
    prereq_codes = [f"{p} {n}" for p, n in prereq_codes]

    return {
        "code":              raw_course["code"],
        "prefix":            raw_course["prefix"],
        "number":            raw_course["number"],
        "title":             title,
        "credits":           int(credits) if credits == int(credits) else credits,
        "subject":           raw_course["subject"],
        "description":       clean_desc,
        "prerequisites_raw": prereqs_raw,
        "prerequisite_codes": prereq_codes,
        "corequisites_raw":  coreqs_raw,
        "page":              raw_course["page"],
    }


# ── Static supplemental data ──────────────────────────────────────────────────

GENED_REQUIREMENTS = """
AAMU General Education Requirements (2026-2027 Bulletin)
All undergraduate students must complete the following General Education curriculum.

Area I – English Composition (6 credit hours)
  ENG 101 – English Composition I (3 cr)
  ENG 102 – English Composition II (3 cr)

Area II – Humanities & Fine Arts (6 credit hours)
  Choose ONE Literature sequence AND ONE Fine Arts course:
  Literature options (choose 2 courses from one group):
    Group A: ENG 211, ENG 212 (World Literature I & II)
    Group B: ENG 221, ENG 222 (American Literature I & II)
    Group C: ENG 231, ENG 232 (British Literature I & II)
  Fine Arts options (choose 1):
    ART 105 (Art Appreciation), MUS 105 (Music Appreciation),
    THE 105 (Theatre Appreciation), HUM 101 (Introduction to Humanities)

Area III – History & Social/Behavioral Sciences (9 credit hours)
  History (6 cr – choose ONE sequence):
    HIS 101 & HIS 102 (World History I & II)
    HIS 201 & HIS 202 (American History I & II)
  Social/Behavioral Science (3 cr – choose ONE):
    ECO 231 (Principles of Macroeconomics), PSC 201 (American Government),
    PSY 201 (General Psychology), SOC 201 (Introduction to Sociology)

Area IV – Natural Sciences & Mathematics (8 credit hours minimum)
  Natural Science (varies by major — CS students take PHY 213 & PHY 214)
  Mathematics (varies by major — CS students take MTH 125 & MTH 126)

Area V – Computer Competency (3 credit hours)
  CS 104 – Introduction to Computers & Ethics (3 cr)  [CS majors satisfy via CS 102/104]

Additional AAMU University Core Requirements:
  ORI 101 – Freshman Experience I (1 cr)
  ORI 102 – Freshman Experience II (1 cr)
  HED 101 – Healthful Living (2 cr)

CS Major Gen Ed specifics:
  Fixed gen-ed courses: ENG 101, ENG 102, PHY 213, PHY 214, MTH 125, MTH 126,
                        ORI 101, ORI 102, HED 101, ECO 231, CS 104
"""

CS_PROGRAM_OVERVIEW = """
AAMU Computer Science Department – BS Computer Science Program (2026-2027)

Total Credits Required: 125

Core CS Required Courses (13 courses, 39 credit hours):
  CS 102 – Introduction to Programming I (3 cr)
  CS 104 – Introduction to Computers & Ethics (3 cr)
  CS 109 – Introduction to Programming II (3 cr)
  CS 203 – Discrete Structures (3 cr)
  CS 206 – Intro Java Programming I (3 cr)
  CS 209 – Introduction to Digital Logic Design (3 cr)
  CS 215 – Data Structures (3 cr)
  CS 314 – Advanced Programming (3 cr)
  CS 401 – Software Engineering (3 cr)
  CS 403 – Senior Problems (3 cr) [CAPSTONE – cannot substitute]
  CS 405 – LINUX with Application Programming (3 cr)
  CS 410 – Seminar (3 cr)
  CS 425 – Theory of Algorithms (3 cr)

Required Math (4 courses, 12 credit hours):
  MTH 125 – Calculus I (3 cr)
  MTH 126 – Calculus II (3 cr)
  MTH 237 – Discrete Mathematics (3 cr)
  MTH 453 – Numerical Analysis (3 cr)

Required Physics (2 courses, 8 credit hours):
  PHY 213 – General Physics I with Lab (4 cr)
  PHY 214 – General Physics II with Lab (4 cr)

Concentrations (choose one, 21 credit hours):
  CYB – Cybersecurity:
    CS 321, CS 381, CS 384, CS 386, CS 414, CS 421, CS 488
  AI – Artificial Intelligence:
    CS 381, CS 384, CS 389, CS 409, CS 430, CS 450, CS 488
  GCS – General Computer Science:
    CS 381, CS 384, CS 488 + 2 electives at 300-level + 2 electives at 400-level

Key Prerequisite Chains:
  CS 102 → CS 109 → CS 215 → most 300/400-level CS courses
  CS 102 → CS 203 → CS 209 → CS 381
  CS 209 + CS 215 → CS 384 (Operating Systems) → CS 405, CS 408, CS 414, CS 421
  CS 102 → CS 206 → CS 314 → CS 401 → CS 403, CS 425
  CS 215 + MTH 126 → CS 425
  CS 215 + MTH 237 → CS 430 (Coreq: MTH 453)

Minimum requirements: 2.0 overall GPA, minimum grade of C in all CS courses.

New for 2026-2027: Separate BS in Artificial Intelligence degree also available.
"""

AI_PROGRAM_OVERVIEW = """
AAMU Department of Computer Science – BS Artificial Intelligence Program (2026-2027)

New degree program offering focused on AI, machine learning, and intelligent systems.

AI Core Courses:
  AI 108 – Introduction to Artificial Intelligence
  AI 350 – AI Systems and Applications
  AI 401 – Advanced Machine Learning
  AI 402 – Deep Learning
  AI 440 – Natural Language Processing
  AI 460 – Computer Vision
  AI 465 – AI Ethics and Policy
  AI 470 – Senior AI Project

CS Foundation Required: CS 102, CS 109, CS 215, MTH 125, MTH 126, MTH 237
"""


def build_rag_chunks(courses: list[dict]) -> list[dict]:
    """Convert course records into RAG-ready text chunks with metadata."""
    chunks: list[dict] = []
    chunk_id = 0

    # ── Course description chunks ─────────────────────────────────────────────
    for c in courses:
        prereq_text = (
            f"Prerequisite: {c['prerequisites_raw']}."
            if c['prerequisites_raw'] and c['prerequisites_raw'].lower() != "none"
            else "No prerequisites."
        )
        coreq_text = (
            f" Corequisite: {c['corequisites_raw']}."
            if c.get('corequisites_raw')
            else ""
        )

        text = (
            f"{c['code']}   {c['title']} – {c['credits']} credit hours. "
            f"{c['description']} "
            f"{prereq_text}{coreq_text}"
        ).strip()

        # Determine course level
        num_str = re.sub(r'[A-Z]', '', c['number'])
        try:
            num = int(num_str)
            level = (num // 100) * 100
        except ValueError:
            level = 0

        chunks.append({
            "id": f"course_{c['code'].replace(' ', '_')}",
            "text": text,
            "metadata": {
                "type":               "course",
                "code":               c["code"],
                "title":              c["title"],
                "subject":            c["subject"],
                "prefix":             c["prefix"],
                "credits":            float(c["credits"]),
                "level":              level,
                "prerequisites_raw":  c["prerequisites_raw"] or "None",
                "prerequisite_codes": ", ".join(c["prerequisite_codes"]),
                "corequisites_raw":   c.get("corequisites_raw") or "",
                "page":               c["page"],
            },
        })
        chunk_id += 1

    # ── Gen Ed chunk ──────────────────────────────────────────────────────────
    chunks.append({
        "id": "gened_requirements",
        "text": GENED_REQUIREMENTS.strip(),
        "metadata": {
            "type":    "program",
            "code":    "GENED",
            "title":   "AAMU General Education Requirements 2026-2027",
            "subject": "General Education",
            "prefix":  "GENED",
            "credits":  0.0,
            "level":    0,
            "prerequisites_raw":  "None",
            "prerequisite_codes": "",
            "corequisites_raw":   "",
            "page":    68,
        },
    })

    # ── CS Program overview chunk ─────────────────────────────────────────────
    chunks.append({
        "id": "cs_program_overview",
        "text": CS_PROGRAM_OVERVIEW.strip(),
        "metadata": {
            "type":    "program",
            "code":    "CS-BS",
            "title":   "AAMU BS Computer Science Program Overview 2026-2027",
            "subject": "Computer Science",
            "prefix":  "CS",
            "credits":  0.0,
            "level":    0,
            "prerequisites_raw":  "None",
            "prerequisite_codes": "",
            "corequisites_raw":   "",
            "page":    199,
        },
    })

    # ── AI Program overview chunk ─────────────────────────────────────────────
    chunks.append({
        "id": "ai_program_overview",
        "text": AI_PROGRAM_OVERVIEW.strip(),
        "metadata": {
            "type":    "program",
            "code":    "AI-BS",
            "title":   "AAMU BS Artificial Intelligence Program Overview 2026-2027",
            "subject": "Artificial Intelligence",
            "prefix":  "AI",
            "credits":  0.0,
            "level":    0,
            "prerequisites_raw":  "None",
            "prerequisite_codes": "",
            "corequisites_raw":   "",
            "page":    203,
        },
    })

    return chunks


# ── Pinecone upload ───────────────────────────────────────────────────────────

def clean_metadata(meta: dict) -> dict:
    """Strip None values; Pinecone requires all values to be non-null."""
    return {k: v for k, v in meta.items() if v is not None}


def embed_and_upload(chunks: list[dict], dry_run: bool = False) -> None:
    from openai import OpenAI
    from pinecone import Pinecone, ServerlessSpec

    openai_key  = os.environ.get("OPENAI_API_KEY")
    pinecone_key = os.environ.get("PINECONE_API_KEY")
    index_name  = os.environ.get("PINECONE_INDEX_NAME", "database")

    if not openai_key or not pinecone_key:
        print("ERROR: OPENAI_API_KEY and PINECONE_API_KEY must be set in scripts/.env")
        sys.exit(1)

    oai = OpenAI(api_key=openai_key)
    pc  = Pinecone(api_key=pinecone_key)

    # Ensure index exists
    existing = [idx.name for idx in pc.list_indexes()]
    if index_name not in existing:
        print(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        time.sleep(10)

    index = pc.index(index_name)

    if dry_run:
        print(f"\n[DRY RUN] Would upload {len(chunks)} chunks.")
        for c in chunks[:5]:
            print(f"  {c['id']}: {c['text'][:120]}...")
        return

    print(f"\nEmbedding and uploading {len(chunks)} chunks to Pinecone index '{index_name}'...")

    # Process in batches
    for batch_start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[batch_start: batch_start + BATCH_SIZE]
        texts = [c["text"][:8000] for c in batch]

        # Embed
        resp = oai.embeddings.create(model=EMBEDDING_MODEL, input=texts)
        vectors = [e.embedding for e in resp.data]

        # Upsert
        upsert_data = [
            {
                "id":       chunk["id"],
                "values":   vec,
                "metadata": clean_metadata({**chunk["metadata"], "text_summary": chunk["text"][:500]}),
            }
            for chunk, vec in zip(batch, vectors)
        ]
        index.upsert(vectors=upsert_data)

        pct = min(100, round((batch_start + len(batch)) / len(chunks) * 100))
        print(f"  [{pct:3d}%] Uploaded chunks {batch_start + 1}–{batch_start + len(batch)}")
        time.sleep(0.5)  # rate limiting

    print(f"\nDone! {len(chunks)} chunks in Pinecone index '{index_name}'.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Build AAMU full RAG database from catalog PDF.")
    parser.add_argument("--extract-only", action="store_true", help="Extract + save JSON, no upload")
    parser.add_argument("--upload-only",  action="store_true", help="Skip extraction, upload saved JSON")
    parser.add_argument("--dry-run",      action="store_true", help="Extract + print sample, no upload")
    args = parser.parse_args()

    if args.upload_only:
        print(f"Loading from {CHUNKS_JSON}...")
        with open(CHUNKS_JSON) as f:
            chunks = json.load(f)
        print(f"Loaded {len(chunks)} chunks.")
    else:
        # ── Step 1: Extract all courses from PDF ──────────────────────────────
        print(f"\nStep 1: Extracting courses from PDF...")
        print(f"  Source: {PDF_PATH}")

        try:
            import pdfplumber  # noqa: F401
        except ImportError:
            print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
            sys.exit(1)

        pages = extract_all_text(PDF_PATH)
        print(f"  Read {len(pages)} pages of course descriptions.")

        courses = parse_courses(pages)
        print(f"\nStep 2: Parsed {len(courses)} course entries.")

        # Subject breakdown
        from collections import Counter
        subject_counts = Counter(c["subject"] for c in courses)
        print(f"  Subjects found: {len(subject_counts)}")
        for subj, cnt in sorted(subject_counts.items(), key=lambda x: -x[1])[:20]:
            print(f"    {subj:<40} {cnt} courses")
        if len(subject_counts) > 20:
            print(f"    ... and {len(subject_counts) - 20} more subjects")

        # Save raw courses
        with open(COURSES_JSON, "w") as f:
            json.dump(courses, f, indent=2)
        print(f"\n  Saved {len(courses)} courses → {COURSES_JSON}")

        # ── Step 3: Build RAG chunks ──────────────────────────────────────────
        print(f"\nStep 3: Building RAG chunks...")
        chunks = build_rag_chunks(courses)
        print(f"  Generated {len(chunks)} total chunks ({len(courses)} courses + 3 program overviews).")

        with open(CHUNKS_JSON, "w") as f:
            json.dump(chunks, f, indent=2)
        print(f"  Saved → {CHUNKS_JSON}")

        if args.extract_only:
            print("\nExtraction complete. Skipping upload (--extract-only).")
            return

    # ── Step 4: Embed + upload to Pinecone ────────────────────────────────────
    print(f"\nStep 4: Uploading to Pinecone...")
    embed_and_upload(chunks, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
