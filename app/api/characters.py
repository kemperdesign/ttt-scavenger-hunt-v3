"""
AI Historian characters: public listing/chat + admin CRUD.
"""

import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
import httpx

from app.db.session import get_db
from app.models.user import User
from app.models.character import AICharacter
from app.auth.deps import get_current_user, get_current_admin
from app.ai.characters import list_characters, get_character
from app.ai.rag import retrieve_context
from app.core.config import settings

router = APIRouter()

SLUG_PATTERN = re.compile(r"^[a-z][a-z0-9_]{2,49}$")


class CharacterOut(BaseModel):
    id: str
    name: str
    display_name: str
    era: str
    personality: str
    greeting: str


class CharacterDetailOut(CharacterOut):
    system_prompt: str
    uncertainty_phrase: str
    source_topics: List[str]


class CharacterCreate(BaseModel):
    id: str
    name: str
    display_name: str
    era: str
    personality: str
    system_prompt: str
    uncertainty_phrase: str
    greeting: str
    source_topics: List[str] = []

    @field_validator("id")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not SLUG_PATTERN.match(v):
            raise ValueError(
                "id must be lowercase letters, numbers, and underscores, "
                "3-50 chars, starting with a letter (e.g. 'town_crier')"
            )
        return v


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    era: Optional[str] = None
    personality: Optional[str] = None
    system_prompt: Optional[str] = None
    uncertainty_phrase: Optional[str] = None
    greeting: Optional[str] = None
    source_topics: Optional[List[str]] = None


class ChatRequest(BaseModel):
    character_id: str
    message: str
    history: Optional[List[dict]] = []  # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    reply: str
    character_id: str
    character_name: str
    retrieved_sources: List[str] = []


def _detail_out(c: AICharacter) -> CharacterDetailOut:
    return CharacterDetailOut(
        id=c.id,
        name=c.name,
        display_name=c.display_name,
        era=c.era,
        personality=c.personality,
        greeting=c.greeting,
        system_prompt=c.system_prompt,
        uncertainty_phrase=c.uncertainty_phrase,
        source_topics=c.source_topics or [],
    )


@router.get("", response_model=List[CharacterOut])
async def list_ai_characters(db: AsyncSession = Depends(get_db)):
    characters = await list_characters(db)
    return [
        CharacterOut(
            id=c.id,
            name=c.name,
            display_name=c.display_name,
            era=c.era,
            personality=c.personality,
            greeting=c.greeting,
        )
        for c in characters
    ]


@router.get("/{character_id}", response_model=CharacterDetailOut)
async def get_ai_character(character_id: str, db: AsyncSession = Depends(get_db)):
    character = await get_character(character_id, db)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return _detail_out(character)


@router.post("", response_model=CharacterDetailOut, status_code=201)
async def create_ai_character(
    body: CharacterCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    existing = await db.execute(select(AICharacter).where(AICharacter.id == body.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Character id '{body.id}' already exists")

    character = AICharacter(**body.model_dump())
    db.add(character)
    await db.flush()
    return _detail_out(character)


@router.patch("/{character_id}", response_model=CharacterDetailOut)
async def update_ai_character(
    character_id: str,
    body: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(AICharacter).where(AICharacter.id == character_id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(character, field, value)

    await db.flush()
    return _detail_out(character)


@router.delete("/{character_id}", status_code=204)
async def delete_ai_character(
    character_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(AICharacter).where(AICharacter.id == character_id))
    character = result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    await db.delete(character)
    await db.flush()
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_character(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    character = await get_character(body.character_id, db)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Retrieve RAG context for the user's message
    try:
        context_chunks = await retrieve_context(
            query=body.message,
            topics=character.source_topics or [],
            top_k=3,
        )
    except Exception:
        context_chunks = []

    system_prompt = character.system_prompt
    if context_chunks:
        context_text = "\n\n".join(context_chunks)
        system_prompt += f"\n\n[Historical context to draw from if relevant:]\n{context_text}"
    else:
        system_prompt += (
            f"\n\nNo specific historical source material was found for this question. "
            f"If it goes beyond what you'd plausibly know from your own character "
            f"background above, say something like \"{character.uncertainty_phrase}\" "
            f"rather than inventing specific dates, names, or figures."
        )

    messages = [{"role": "system", "content": system_prompt}]
    for turn in (body.history or []):
        messages.append(turn)
    messages.append({"role": "user", "content": body.message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    return ChatResponse(
        reply=reply,
        character_id=character.id,
        character_name=character.display_name,
        retrieved_sources=context_chunks,
    )
