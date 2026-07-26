"""
St. Augustine TimeQuest — AI Historian character lookups.

Characters are stored in the ai_characters table (see migration
003_add_ai_characters) and manageable via the admin API/UI. This module
just wraps the DB queries so call sites don't need to know the storage
detail.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.character import AICharacter


async def get_character(character_id: str, db: AsyncSession) -> AICharacter | None:
    result = await db.execute(select(AICharacter).where(AICharacter.id == character_id))
    return result.scalar_one_or_none()


async def list_characters(db: AsyncSession) -> list[AICharacter]:
    result = await db.execute(select(AICharacter).order_by(AICharacter.name))
    return list(result.scalars().all())
