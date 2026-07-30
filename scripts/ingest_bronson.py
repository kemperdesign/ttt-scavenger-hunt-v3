"""
Bulk-register and ingest all Dr. Bronson history PDFs into the source_documents
table and Qdrant vector store.

Usage (run from repo root, with backend venv active and Qdrant + Postgres reachable):

    python scripts/ingest_bronson.py --dir "H:/projects/TTT/Dr Bronson"
    python scripts/ingest_bronson.py --dir "H:/projects/TTT/Dr Bronson" --dry-run
    python scripts/ingest_bronson.py --dir "/opt/timequest/bronson"   # on the server

The script is idempotent: if a source_document record already exists for a given
filename it skips re-registration but still re-ingests unless --skip-ingested is
passed.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# ── Catalogue ─────────────────────────────────────────────────────────────────
# Maps filename stem → (periods_covered, locations_covered, notes)
BRONSON_CATALOGUE = {
    "Dr. Bronson and Friends_ A History of the City of St. Augustine, St. Augustine_s 1st Spanish Period (part 1) 1565-1600": (
        ["1st Spanish Period 1565-1600"],
        ["St. Augustine"],
        "Part 1: founding through the late 16th century.",
    ),
    "1st Spanish Period 1600-1700": (
        ["1st Spanish Period 1600-1700"],
        ["St. Augustine"],
        "17th century: Castillo construction, English raids, piracy.",
    ),
    "St. Augustine 1st Spanish Period 1700 - 1763": (
        ["1st Spanish Period 1700-1763"],
        ["St. Augustine"],
        "Early 18th century: Oglethorpe sieges, decline of Timucua.",
    ),
    "Dr. Bronson_s History Page - British Period 1763- 1784": (
        ["British Period 1763-1784"],
        ["St. Augustine", "East Florida"],
        "British colonial period; Loyalist refugees.",
    ),
    "Dr. Bronson_s History Page - 2nd Spanish Period": (
        ["2nd Spanish Period 1784-1821"],
        ["St. Augustine"],
        "Second Spanish Period; free Black settlers.",
    ),
    "Dr. Bronson_s History Page - American Territorial Period": (
        ["American Territorial Period 1821-1845"],
        ["St. Augustine", "Florida Territory"],
        "US takeover; Seminole Wars; Osceola at the Castillo.",
    ),
    "Florida Statehood 1845-1861": (
        ["Florida Statehood 1845-1861"],
        ["St. Augustine", "Florida"],
        "Antebellum period; tourism beginnings.",
    ),
    "St. Augustine in the Civil War": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 1.",
    ),
    "St. Augustine in the Civil War, p2": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 2.",
    ),
    "St. Augustine in the Civil War p3": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 3.",
    ),
    "Recruiting Black Regiments St. Augustine in the Civil War": (
        ["Civil War 1861-1865"],
        ["St. Augustine", "Lincolnville"],
        "USCT recruitment in St. Augustine.",
    ),
    "St. Augustine in the Civil War 1861-1865 page 5": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 5.",
    ),
    "St. Augustine in the Civil War page 4": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 4.",
    ),
    "St. Augustine in the Civil War - Page 6": (
        ["Civil War 1861-1865"],
        ["St. Augustine"],
        "Civil War pt 6.",
    ),
    "Reconstruction in St. Augustine": (
        ["Reconstruction 1865-1877"],
        ["St. Augustine", "Lincolnville"],
        "Reconstruction era; founding of Lincolnville.",
    ),
    "Post Reconstruction in St. Augustine": (
        ["Post-Reconstruction 1877-1888"],
        ["St. Augustine", "Lincolnville"],
        "Post-Reconstruction; Jim Crow beginnings.",
    ),
    "Dr. Bronson_s History Page - Flagler Era": (
        ["Flagler Era 1885-1890"],
        ["St. Augustine", "Flagler College"],
        "Flagler's arrival; Ponce de León Hotel construction.",
    ),
    "Dr. Bronson_s History Page Flagler Era - 1890 to 1900 ab urbe conditita - 367 to 377": (
        ["Flagler Era 1890-1900"],
        ["St. Augustine", "Flagler College"],
        "Flagler Era 1890–1900; hotel social life.",
    ),
    "Dr. Bronson_s History Page - The Progressive Era to 1913": (
        ["Progressive Era 1900-1913"],
        ["St. Augustine"],
        "Progressive Era; Flagler death 1913.",
    ),
    "Dr. Bronson_s History Page The New Freedom and World War I": (
        ["World War I Era 1913-1920"],
        ["St. Augustine"],
        "Wilson era and WWI impact on St. Augustine.",
    ),
    "The History of St. Augustine The Roaring 1920s": (
        ["1920s"],
        ["St. Augustine"],
        "Tourism boom; Florida land rush.",
    ),
    "Dr. Bronson_s History Page - The Great Depression to World War II": (
        ["Great Depression and WWII 1929-1945"],
        ["St. Augustine"],
        "Depression-era St. Augustine; WWII military presence.",
    ),
    "Dr. Bronson_s History Page - World War II to Present": (
        ["Post-WWII 1945-present"],
        ["St. Augustine"],
        "Post-war growth and modernization.",
    ),
    "Post World War II 1946-1960": (
        ["Post-WWII 1946-1960"],
        ["St. Augustine"],
        "Postwar decade; pre-civil-rights era.",
    ),
    "St. Augustine Civil Rights 1960 -1965": (
        ["Civil Rights 1960-1965"],
        ["St. Augustine", "Lincolnville"],
        "Civil rights movement; King arrest; Civil Rights Act.",
    ),
    "St. Augustine Rebounds": (
        ["Post-Civil Rights 1965-present"],
        ["St. Augustine"],
        "Recovery and 400th anniversary planning.",
    ),
    "History of St. Augustine by Gil Wilson": (
        ["General History"],
        ["St. Augustine"],
        "Broad overview by Gil Wilson; supplementary source.",
    ),
    "St. Augustine Timeline": (
        ["General History"],
        ["St. Augustine"],
        "Chronological timeline reference.",
    ),
    "Spanish Vocabulary": (
        ["General Reference"],
        ["St. Augustine"],
        "Spanish vocabulary reference for colonial period.",
    ),
}


async def run(source_dir: Path, dry_run: bool, skip_ingested: bool) -> None:
    # Import here so the script can be run from the repo root with venv active
    import os
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select

    from app.core.config import settings
    from app.models.source_document import SourceDocument
    from app.ai.ingest import ingest_file

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    pdfs = sorted(source_dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {source_dir}")
        sys.exit(1)

    print(f"Found {len(pdfs)} PDFs in {source_dir}")
    if dry_run:
        print("[DRY RUN — no changes will be written]\n")

    async with AsyncSessionLocal() as db:
        for pdf in pdfs:
            stem = pdf.stem
            catalogue_entry = BRONSON_CATALOGUE.get(stem)
            if catalogue_entry is None:
                print(f"  SKIP (not in catalogue): {pdf.name}")
                continue

            periods, locations, notes = catalogue_entry

            # Find or create source_document record
            result = await db.execute(
                select(SourceDocument).where(SourceDocument.local_filename == pdf.name)
            )
            source = result.scalar_one_or_none()

            if source is None:
                print(f"  REGISTER: {pdf.name}")
                if not dry_run:
                    source = SourceDocument(
                        title=stem.replace("_", " "),
                        author="Dr. Earl W. Bronson",
                        rights_status="permission_granted",
                        reliability="primary",
                        review_status="approved",
                        reviewer="Dr. Earl W. Bronson (author)",
                        local_filename=pdf.name,
                        periods_covered=periods,
                        locations_covered=locations,
                        notes=notes,
                        ingested=False,
                    )
                    db.add(source)
                    await db.flush()
            else:
                print(f"  EXISTS: {pdf.name} (id={source.id}, ingested={source.ingested})")

            if dry_run:
                print(f"    → would ingest: {pdf}")
                continue

            if source.ingested and skip_ingested:
                print(f"    → already ingested ({source.chunk_count} chunks), skipping")
                continue

            print(f"    → ingesting {pdf.name} …")
            topic = periods[0]
            try:
                chunk_count = ingest_file(
                    path=str(pdf),
                    topic=topic,
                    source_title=stem,
                )
                source.ingested = True
                source.chunk_count = chunk_count
                source.minio_key = None  # local ingest; no MinIO upload
                await db.flush()
                print(f"       {chunk_count} chunks written to Qdrant")
            except Exception as e:
                print(f"       ERROR: {e}")

        await db.commit()

    print("\nDone.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Dr. Bronson PDFs into Qdrant")
    parser.add_argument(
        "--dir",
        required=True,
        help="Directory containing the Dr. Bronson PDF files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would happen without writing anything",
    )
    parser.add_argument(
        "--skip-ingested",
        action="store_true",
        default=True,
        help="Skip PDFs already marked ingested=True (default: on)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-ingest even files already marked ingested",
    )
    args = parser.parse_args()

    source_dir = Path(args.dir)
    if not source_dir.is_dir():
        print(f"Directory not found: {source_dir}")
        sys.exit(1)

    skip = args.skip_ingested and not args.force
    asyncio.run(run(source_dir, dry_run=args.dry_run, skip_ingested=skip))


if __name__ == "__main__":
    main()
