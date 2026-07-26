"""
Upload AAMU CS knowledge base to Pinecone.

Prerequisites:
  1. Run aamu_cs_scraper.py first → generates data/cs_knowledge.json
  2. Set env vars (copy .env.example → .env and fill in):
       OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME

Usage:
  python upload_to_pinecone.py                 # full upsert
  python upload_to_pinecone.py --dry-run       # print chunks, no upload
  python upload_to_pinecone.py --create-index  # create index if it doesn't exist
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec

load_dotenv(Path(__file__).parent / ".env")

# ──────────────────────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────────────────────

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536
BATCH_SIZE = 50          # vectors per upsert call
MAX_TEXT_LEN = 8000      # chars — well within OpenAI's 8192-token limit


def get_env(key: str) -> str:
    val = os.environ.get(key)
    if not val:
        print(f"[ERROR] Missing environment variable: {key}", file=sys.stderr)
        print(f"        Copy scripts/.env.example → scripts/.env and fill it in.", file=sys.stderr)
        sys.exit(1)
    return val


# ──────────────────────────────────────────────────────────────────────────────
# CHUNKING — build text chunks with metadata from cs_knowledge.json
# ──────────────────────────────────────────────────────────────────────────────

def chunks_from_overview(overview: dict) -> list[dict]:
    return [{
        "id": overview["id"],
        "text": overview["text_summary"][:MAX_TEXT_LEN],
        "metadata": {
            "type": "degree_overview",
            "bulletin_year": overview.get("bulletin_year", "2025-2026"),
        },
    }]


def chunks_from_course(course: dict) -> list[dict]:
    """One rich chunk per course covering all angles an advisor might need."""
    parts = [
        f"{course['code']} — {course['name']} ({course['credits']} credits)",
        f"Level: {course.get('level', 'N/A')}-level course",
        f"Department: {course.get('department', 'CS')}",
    ]
    if course.get("description"):
        parts.append(f"Description: {course['description']}")
    if course.get("min_grade"):
        parts.append(f"Minimum grade required: {course['min_grade']}")
    if course.get("is_capstone"):
        parts.append("This is a [CS] CAPSTONE course and cannot be substituted.")
    if course.get("senior_standing_required"):
        parts.append("Senior Standing required to enroll.")
    if course.get("standing_required"):
        parts.append(f"Standing required: {course['standing_required']}")
    if course.get("prerequisites_immediate"):
        parts.append(f"Immediate prerequisites: {', '.join(course['prerequisites_immediate'])}")
    else:
        parts.append("Prerequisites: None")
    if course.get("prerequisites_full_chain"):
        parts.append(f"Full prerequisite chain: {course['prerequisites_full_chain']}")
    if course.get("concentrations"):
        parts.append(f"Required by concentrations: {', '.join(course['concentrations'])}")
    if course.get("plan_year"):
        parts.append(f"Typically taken: {course['plan_year']} Year, Semester {course.get('plan_semester', '?')}")

    return [{
        "id": course["id"],
        "text": "\n".join(parts)[:MAX_TEXT_LEN],
        "metadata": {
            "type": "course",
            "course_code": course["code"],
            "course_name": course["name"],
            "credits": course.get("credits"),
            "level": course.get("level"),
            "is_capstone": course.get("is_capstone", False),
            "concentrations": course.get("concentrations", []),
            "plan_year": course.get("plan_year", ""),
            "bulletin_year": course.get("bulletin_year", "2025-2026"),
        },
    }]


def chunks_from_concentration(conc: dict) -> list[dict]:
    return [{
        "id": conc["id"],
        "text": conc["text_summary"][:MAX_TEXT_LEN],
        "metadata": {
            "type": "concentration",
            "concentration_key": conc["key"],
            "concentration_code": conc["code"],
            "total_hours": conc["total_hours"],
            "min_gpa": conc["min_gpa"],
            "bulletin_year": conc.get("bulletin_year", "2025-2026"),
        },
    }]


def chunks_from_prereq(prereq: dict) -> list[dict]:
    return [{
        "id": prereq["id"],
        "text": prereq["text_summary"][:MAX_TEXT_LEN],
        "metadata": {
            "type": "prerequisite_chain",
            "course_code": prereq["course_code"],
            "course_name": prereq["course_name"],
            "bulletin_year": prereq.get("bulletin_year", "2025-2026"),
        },
    }]


def chunks_from_plan(plan: dict) -> list[dict]:
    return [{
        "id": plan["id"],
        "text": plan["text_summary"][:MAX_TEXT_LEN],
        "metadata": {
            "type": "four_year_plan",
            "year": plan["year"],
            "semester": plan["semester"],
            "label": plan["label"],
            "total_credits": str(plan["total_credits"]),
            "bulletin_year": plan.get("bulletin_year", "2025-2026"),
        },
    }]


def build_all_chunks(kb: dict) -> list[dict]:
    chunks = []
    chunks.extend(chunks_from_overview(kb["overview"]))
    for course in kb["courses"]:
        chunks.extend(chunks_from_course(course))
    for conc in kb["concentrations"]:
        chunks.extend(chunks_from_concentration(conc))
    for prereq in kb["prerequisite_chains"]:
        chunks.extend(chunks_from_prereq(prereq))
    for plan in kb["four_year_plan"]:
        chunks.extend(chunks_from_plan(plan))
    return chunks


# ──────────────────────────────────────────────────────────────────────────────
# EMBEDDING
# ──────────────────────────────────────────────────────────────────────────────

def embed_chunks(client: OpenAI, chunks: list[dict], verbose: bool = True) -> list[dict]:
    """Embed all chunks in batches; returns chunks with 'values' added."""
    texts = [c["text"] for c in chunks]
    embedded = []
    total = len(texts)
    for i in range(0, total, BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        if verbose:
            print(f"  Embedding batch {i // BATCH_SIZE + 1}/{(total + BATCH_SIZE - 1) // BATCH_SIZE} "
                  f"({len(batch_texts)} chunks)...")
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=batch_texts)
        for chunk, emb_obj in zip(chunks[i : i + BATCH_SIZE], resp.data):
            embedded.append({**chunk, "values": emb_obj.embedding})
        time.sleep(0.3)  # rate-limit courtesy pause
    return embedded


# ──────────────────────────────────────────────────────────────────────────────
# PINECONE
# ──────────────────────────────────────────────────────────────────────────────

def get_or_create_index(pc: Pinecone, index_name: str, create: bool) -> Any:
    existing = [idx.name for idx in pc.list_indexes()]
    if index_name in existing:
        print(f"[INFO] Using existing index: {index_name}")
        return pc.Index(index_name)
    if not create:
        print(f"[ERROR] Index '{index_name}' does not exist.", file=sys.stderr)
        print(f"        Run with --create-index to create it, or create it in the Pinecone console.", file=sys.stderr)
        sys.exit(1)
    print(f"[INFO] Creating serverless index: {index_name} (dim={EMBEDDING_DIMENSION}, metric=cosine)")
    pc.create_index(
        name=index_name,
        dimension=EMBEDDING_DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    # Wait for index to be ready
    for _ in range(30):
        status = pc.describe_index(index_name).status
        if status.get("ready"):
            break
        print("  Waiting for index to be ready...")
        time.sleep(5)
    return pc.Index(index_name)


def clean_metadata(meta: dict) -> dict:
    """Remove None values — Pinecone rejects null metadata fields."""
    return {k: v for k, v in meta.items() if v is not None}


def upsert_to_pinecone(index: Any, embedded_chunks: list[dict]) -> None:
    total = len(embedded_chunks)
    for i in range(0, total, BATCH_SIZE):
        batch = embedded_chunks[i : i + BATCH_SIZE]
        vectors = [
            {"id": c["id"], "values": c["values"], "metadata": clean_metadata(c["metadata"])}
            for c in batch
        ]
        index.upsert(vectors=vectors)
        print(f"  Upserted {min(i + BATCH_SIZE, total)}/{total} vectors")
        time.sleep(0.2)


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Upload AAMU CS knowledge base to Pinecone.")
    parser.add_argument("--dry-run", action="store_true", help="Print chunks without uploading")
    parser.add_argument("--create-index", action="store_true", help="Create Pinecone index if missing")
    args = parser.parse_args()

    # Load knowledge base
    kb_path = Path(__file__).parent / "data" / "cs_knowledge.json"
    if not kb_path.exists():
        print(f"[ERROR] Knowledge base not found at {kb_path}", file=sys.stderr)
        print(f"        Run: python aamu_cs_scraper.py first", file=sys.stderr)
        sys.exit(1)

    with open(kb_path) as f:
        kb = json.load(f)

    print(f"[INFO] Loaded knowledge base: {kb['metadata']['total_records']} records")

    # Build text chunks
    chunks = build_all_chunks(kb)
    print(f"[INFO] Built {len(chunks)} text chunks for RAG")

    if args.dry_run:
        print("\n── DRY RUN — first 3 chunks ──────────────────────────────────────")
        for chunk in chunks[:3]:
            print(f"\nID: {chunk['id']}")
            print(f"Metadata: {json.dumps(chunk['metadata'], indent=2)}")
            print(f"Text:\n{chunk['text'][:400]}...")
        print(f"\n── {len(chunks)} total chunks (no upload) ──")
        return

    # Embed
    openai_key = get_env("OPENAI_API_KEY")
    oai = OpenAI(api_key=openai_key)
    print(f"\n[INFO] Embedding {len(chunks)} chunks with {EMBEDDING_MODEL}...")
    embedded = embed_chunks(oai, chunks)
    print(f"[INFO] Embedding complete")

    # Upload to Pinecone
    pinecone_key = get_env("PINECONE_API_KEY")
    index_name = get_env("PINECONE_INDEX_NAME")
    pc = Pinecone(api_key=pinecone_key)
    index = get_or_create_index(pc, index_name, args.create_index)

    print(f"\n[INFO] Upserting {len(embedded)} vectors to index '{index_name}'...")
    upsert_to_pinecone(index, embedded)

    # Verify
    stats = index.describe_index_stats()
    print(f"\n[DONE] Index stats: {stats.total_vector_count} total vectors in index")


if __name__ == "__main__":
    main()
