"""
AI Historian character chat endpoint.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx

from app.db.session import get_db
from app.models.user import User
from app.auth.deps import get_current_user
from app.ai.characters import list_characters, get_character
from app.ai.rag import retrieve_context
from app.core.config import settings

router = APIRouter()


class CharacterOut(BaseModel):
    id: str
    name: str
    display_name: str
    era: str
    personality: str
    greeting: str


class ChatRequest(BaseModel):
    character_id: str
    message: str
    history: Optional[List[dict]] = []  # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    reply: str
    character_id: str
    character_name: str


@router.get("", response_model=List[CharacterOut])
async def list_ai_characters():
    return [
        CharacterOut(
            id=c["id"],
            name=c["name"],
            display_name=c["display_name"],
            era=c["era"],
            personality=c["personality"],
            greeting=c["greeting"],
        )
        for c in list_characters()
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat_with_character(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    character = get_character(body.character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Retrieve RAG context for the user's message
    try:
        context_chunks = await retrieve_context(
            query=body.message,
            topics=character.get("source_topics", []),
            top_k=3,
        )
        context_text = "\n\n".join(context_chunks) if context_chunks else ""
    except Exception:
        context_text = ""

    # Build messages list for Ollama
    system_prompt = character["system_prompt"]
    if context_text:
        system_prompt += (
            f"\n\n[Historical context to draw from if relevant:]\n{context_text}"
        )

    messages = [{"role": "system", "content": system_prompt}]
    for turn in (body.history or []):
        messages.append(turn)
    messages.append({"role": "user", "content": body.message})

    # Call Ollama chat API
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_CHAT_MODEL,
                    "messages": messages,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    return ChatResponse(
        reply=reply,
        character_id=character["id"],
        character_name=character["display_name"],
    )
