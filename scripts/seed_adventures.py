#!/usr/bin/env python3
"""
Seed the database with the initial St. Augustine TimeQuest adventures.
Idempotent — checks if adventures already exist before inserting.

Usage:
    python scripts/seed_adventures.py
    python scripts/seed_adventures.py --force  (re-seed even if data exists)
"""

import sys
import asyncio
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from app.core.config import settings
from app.db.base import Base  # must come first: registers all models, avoids circular import
from app.models.adventure import Adventure
from app.models.stop import Stop
from app.models.badge import Badge


engine = create_async_engine(settings.DATABASE_URL)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


ADVENTURE_DATA = {
    "title": "Founding St. Augustine: 1565",
    "slug": "founding-st-augustine-1565",
    "description": (
        "Follow Pedro Menéndez de Avilés from the moment his ships entered Matanzas Bay "
        "to the founding ceremony on September 8, 1565. Visit the sites where the first "
        "permanent European settlement in the continental United States took root."
    ),
    "short_description": "Trace the founding of America's oldest city on foot.",
    "difficulty": "moderate",
    "estimated_duration_minutes": 90,
    "start_lat": 29.8981,
    "start_lng": -81.3120,
    "total_points": 500,
    "tags": ["history", "colonial", "spanish", "founding"],
    "is_published": True,
    "is_featured": True,
}

STOPS_DATA = [
    {
        "title": "Castillo de San Marcos",
        "description": "The oldest masonry fort in the continental United States, built of coquina between 1672 and 1695.",
        "historical_content": (
            "The Castillo's coquina walls never fell to cannon fire. When English forces "
            "bombarded it during the 1702 siege, cannonballs sank into the soft shell-stone "
            "instead of shattering it. Doña Isabella Reyes, our colonial guide, took shelter "
            "here during the 1740 siege."
        ),
        "order_index": 0,
        "lat": 29.8981,
        "lng": -81.3120,
        "gps_radius_meters": 50.0,
        "ai_character_id": "spanish_colonial_guide",
        "points": 100,
        "hint_text": "Look for the star-shaped fort with coquina walls on the waterfront.",
    },
    {
        "title": "City Gates of St. Augustine",
        "description": "The original northern boundary of the colonial city, rebuilt in 1808 on foundations dating to 1739.",
        "historical_content": (
            "These gates marked the entrance to the colonial town along the Old King's Highway. "
            "During the British period (1763-1783), Scottish merchant Thomas Dunbar would have "
            "passed through here regularly on his way to trade with loyalist refugees."
        ),
        "order_index": 1,
        "lat": 29.8937,
        "lng": -81.3131,
        "gps_radius_meters": 30.0,
        "ai_character_id": "colonial_shopkeeper",
        "points": 100,
        "hint_text": "Two white pillars flanking the entrance to St. George Street.",
    },
    {
        "title": "Flagler College / Ponce de León Hotel",
        "description": "Henry Flagler's 1888 masterpiece — the most luxurious hotel in the Americas when it opened.",
        "historical_content": (
            "Henry Flagler built this Spanish Renaissance Revival hotel in 1888 using "
            "the then-cutting-edge technology of poured concrete. Thomas Edison personally "
            "installed the electric lighting — one of the first hotels in the world to have it. "
            "Mrs. Eleanor Whitmore, wintering here in 1895, described the rotunda as "
            "'the most magnificent room I have ever entered.'"
        ),
        "order_index": 2,
        "lat": 29.8898,
        "lng": -81.3135,
        "gps_radius_meters": 40.0,
        "ai_character_id": "henry_flagler",
        "points": 100,
        "hint_text": "The yellow Spanish-style building on King Street, now a college.",
    },
    {
        "title": "Fountain of Youth Archaeological Park",
        "description": "Site of the first Timucua village encountered by Menéndez in 1565 and the original landing site.",
        "historical_content": (
            "Archaeological evidence places a Timucua village of the Seloy band here. "
            "Pedro Menéndez celebrated the first Mass of the new settlement at or near "
            "this site on September 8, 1565, with the Timucua people watching."
        ),
        "order_index": 3,
        "lat": 29.9028,
        "lng": -81.3169,
        "gps_radius_meters": 60.0,
        "ai_character_id": "pedro_menendez",
        "points": 100,
        "hint_text": "North of downtown along Magnolia Avenue — look for the peacocks.",
    },
    {
        "title": "Lincolnville — Civil Rights Landmark",
        "description": "The heart of St. Augustine's Black community and center of the 1964 civil rights demonstrations.",
        "historical_content": (
            "In 1964, Dr. Robert Hayling led night marches from Lincolnville toward the "
            "segregated tourist areas downtown. James Holloway, 19, walked these streets. "
            "Dr. Martin Luther King Jr. was arrested nearby during his visit to St. Augustine, "
            "and events here directly contributed to the Civil Rights Act of 1964."
        ),
        "order_index": 4,
        "lat": 29.8810,
        "lng": -81.3098,
        "gps_radius_meters": 40.0,
        "ai_character_id": "civil_rights_guide",
        "points": 100,
        "hint_text": "The historic neighborhood south of the plaza — look for the community signs.",
    },
]

BADGES_DATA = [
    {
        "name": "Founding Explorer",
        "description": "Completed the Founding St. Augustine adventure",
        "icon_emoji": "🏆",
        "trigger_condition": {"type": "adventure_complete"},
    },
    {
        "name": "Speed Historian",
        "description": "Completed the adventure in under 75 minutes",
        "icon_emoji": "⚡",
        "trigger_condition": {"type": "speed_run", "max_minutes": 75},
    },
    {
        "name": "Pathfinder",
        "description": "Completed the adventure without using any hints",
        "icon_emoji": "🧭",
        "trigger_condition": {"type": "no_hints"},
    },
]


async def seed():
    async with SessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(func.count()).select_from(Adventure))
        count = result.scalar()
        if count and count > 0:
            print(f"Database already has {count} adventure(s). Use --force to re-seed.")
            return

        print("Seeding adventures…")

        # Create adventure
        adventure = Adventure(**ADVENTURE_DATA)
        db.add(adventure)
        await db.flush()

        # Create stops
        for stop_data in STOPS_DATA:
            stop = Stop(adventure_id=adventure.id, **stop_data)
            db.add(stop)

        # Create badges
        for badge_data in BADGES_DATA:
            badge = Badge(adventure_id=adventure.id, **badge_data)
            db.add(badge)

        await db.commit()
        print(f"✅ Seeded adventure '{adventure.title}' with {len(STOPS_DATA)} stops and {len(BADGES_DATA)} badges")


async def force_seed():
    async with SessionLocal() as db:
        result = await db.execute(select(Adventure).where(Adventure.slug == "founding-st-augustine-1565"))
        existing = result.scalar_one_or_none()
        if existing:
            await db.delete(existing)
            await db.commit()
    await seed()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    asyncio.run(force_seed() if args.force else seed())
