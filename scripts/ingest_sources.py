#!/usr/bin/env python3
"""
Ingest all registered historical sources into Qdrant.

Usage:
    python scripts/ingest_sources.py
    python scripts/ingest_sources.py --topic castillo_de_san_marcos
    python scripts/ingest_sources.py --dry-run
"""

import sys
import argparse
from pathlib import Path

# Ensure app is importable from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.ingest import ingest_file
from app.ai.source_register import SOURCES
from qdrant_client import QdrantClient
from app.core.config import settings


def main():
    parser = argparse.ArgumentParser(description="Ingest historical source documents")
    parser.add_argument("--topic", help="Only ingest sources with this topic")
    parser.add_argument("--dry-run", action="store_true", help="List sources without ingesting")
    args = parser.parse_args()

    client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

    sources_to_ingest = [
        s for s in SOURCES
        if not args.topic or s["topic"] == args.topic
    ]

    print(f"Found {len(sources_to_ingest)} source(s) to ingest")

    if args.dry_run:
        for s in sources_to_ingest:
            print(f"  [DRY RUN] {s['title']} ({s['topic']}) <- {s['path']}")
        return

    total_chunks = 0
    for source in sources_to_ingest:
        path = Path(source["path"])
        if not path.exists():
            print(f"  [SKIP] File not found: {path}")
            continue
        print(f"\nIngesting: {source['title']}")
        chunks = ingest_file(
            path=str(path),
            topic=source["topic"],
            source_title=source["title"],
            client=client,
        )
        total_chunks += chunks

    print(f"\nDone. Total chunks ingested: {total_chunks}")


if __name__ == "__main__":
    main()
