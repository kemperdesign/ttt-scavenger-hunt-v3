#!/usr/bin/env python3
"""
Generic adventure content importer — creates a full adventure (stops,
challenges, badges) from a single JSON file, instead of the hardcoded
one-adventure seed_adventures.py.

Usage:
    python scripts/import_adventure.py --file path/to/adventure.json
    python scripts/import_adventure.py --file path/to/adventure.json --dry-run
    python scripts/import_adventure.py --file path/to/adventure.json --force

--dry-run   Validate the file and print a summary without writing to the DB.
--force     If an adventure with the same slug already exists, delete it
            (cascades to its stops/challenges/badges) and re-import.

See scripts/adventure_template.json for the expected file shape.
"""

import sys
import json
import asyncio
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.db.base import Base  # must come first: registers all models, avoids circular import
from app.models.adventure import Adventure
from app.models.stop import Stop
from app.models.challenge import Challenge
from app.models.badge import Badge

engine = create_async_engine(settings.DATABASE_URL)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

REQUIRED_ADVENTURE_FIELDS = ["title", "slug"]
REQUIRED_STOP_FIELDS = ["title", "lat", "lng"]
VALID_CHALLENGE_TYPES = {
    "gps_checkin", "multiple_choice", "text_answer", "photo_submission",
    "ai_conversation", "sequence_puzzle", "qr_code", "branching_story",
}


class ValidationError(Exception):
    pass


def load_and_validate(path: Path) -> dict:
    if not path.exists():
        raise ValidationError(f"File not found: {path}")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")

    adventure = data.get("adventure")
    if not isinstance(adventure, dict):
        raise ValidationError("Top-level 'adventure' object is required")
    for field in REQUIRED_ADVENTURE_FIELDS:
        if not adventure.get(field):
            raise ValidationError(f"adventure.{field} is required")

    stops = data.get("stops", [])
    if not isinstance(stops, list) or not stops:
        raise ValidationError("'stops' must be a non-empty array")

    for i, stop in enumerate(stops):
        for field in REQUIRED_STOP_FIELDS:
            if stop.get(field) in (None, ""):
                raise ValidationError(f"stops[{i}].{field} is required")
        for j, ch in enumerate(stop.get("challenges", [])):
            ctype = ch.get("challenge_type")
            if ctype not in VALID_CHALLENGE_TYPES:
                raise ValidationError(
                    f"stops[{i}].challenges[{j}].challenge_type '{ctype}' is invalid — "
                    f"must be one of {sorted(VALID_CHALLENGE_TYPES)}"
                )

    badges = data.get("badges", [])
    if not isinstance(badges, list):
        raise ValidationError("'badges' must be an array (can be empty)")

    return data


def summarize(data: dict) -> str:
    adventure = data["adventure"]
    stops = data["stops"]
    total_challenges = sum(len(s.get("challenges", [])) for s in stops)
    badges = data.get("badges", [])
    lines = [
        f"Adventure: {adventure['title']} ({adventure['slug']})",
        f"Stops: {len(stops)}",
        f"Challenges: {total_challenges}",
        f"Badges: {len(badges)}",
        "",
        "Stops:",
    ]
    for i, s in enumerate(stops):
        ch_count = len(s.get("challenges", []))
        lines.append(f"  {i + 1}. {s['title']} ({ch_count} challenge{'s' if ch_count != 1 else ''})")
    return "\n".join(lines)


async def import_adventure(data: dict, force: bool) -> None:
    async with SessionLocal() as db:
        slug = data["adventure"]["slug"]
        existing = await db.execute(select(Adventure).where(Adventure.slug == slug))
        existing_adventure = existing.scalar_one_or_none()

        if existing_adventure:
            if not force:
                raise ValidationError(
                    f"An adventure with slug '{slug}' already exists. Use --force to replace it."
                )
            await db.delete(existing_adventure)
            await db.flush()

        adventure = Adventure(**data["adventure"])
        db.add(adventure)
        await db.flush()

        challenge_count = 0
        for order_index, stop_data in enumerate(data["stops"]):
            challenges = stop_data.pop("challenges", [])
            stop_fields = dict(stop_data)
            stop_fields.setdefault("order_index", order_index)
            stop = Stop(adventure_id=adventure.id, **stop_fields)
            db.add(stop)
            await db.flush()

            for ch_order, ch_data in enumerate(challenges):
                ch_fields = dict(ch_data)
                ch_fields.setdefault("order_index", ch_order)
                ch_fields.setdefault("title", "Untitled Challenge")
                ch_fields.setdefault("prompt", "")
                ch_fields.setdefault("points", 10)
                ch_fields.setdefault("is_required", True)
                ch_fields.setdefault("config", {})
                db.add(Challenge(stop_id=stop.id, **ch_fields))
                challenge_count += 1

        for badge_data in data.get("badges", []):
            db.add(Badge(adventure_id=adventure.id, **badge_data))

        await db.commit()
        print(
            f"Imported '{adventure.title}' — {len(data['stops'])} stops, "
            f"{challenge_count} challenges, {len(data.get('badges', []))} badges"
        )


async def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--file", required=True, type=Path, help="Path to the adventure JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, don't write to the database")
    parser.add_argument("--force", action="store_true", help="Replace an existing adventure with the same slug")
    args = parser.parse_args()

    try:
        data = load_and_validate(args.file)
    except ValidationError as e:
        print(f"Validation failed: {e}")
        sys.exit(1)

    print(summarize(data))
    print()

    if args.dry_run:
        print("Dry run — nothing was written to the database.")
        return

    try:
        await import_adventure(data, force=args.force)
    except ValidationError as e:
        print(f"Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
