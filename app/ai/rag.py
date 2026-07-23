"""
RAG retrieval: embed query via Ollama → search Qdrant → return relevant chunks.
"""

from typing import List
import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchAny

from app.core.config import settings

COLLECTION = settings.QDRANT_COLLECTION
EMBED_MODEL = settings.OLLAMA_EMBED_MODEL
UNCERTAINTY_THRESHOLD = settings.RAG_UNCERTAINTY_THRESHOLD

# Prompt injection guard patterns
INJECTION_PATTERNS = [
    "ignore previous instructions",
    "forget your instructions",
    "you are now",
    "new persona",
    "disregard",
    "system prompt",
    "jailbreak",
]


def _check_injection(text: str) -> bool:
    """Returns True if text looks like a prompt injection attempt."""
    lower = text.lower()
    return any(pattern in lower for pattern in INJECTION_PATTERNS)


async def embed_text(text: str) -> List[float]:
    """Embed a string via Ollama and return the vector."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
        )
        response.raise_for_status()
        return response.json()["embedding"]


async def retrieve_context(
    query: str,
    topics: List[str] | None = None,
    top_k: int = 3,
) -> List[str]:
    """
    Embed the query, search Qdrant for relevant historical chunks,
    filter by score threshold, and return text snippets.

    Returns empty list if:
    - The query looks like a prompt injection
    - No results exceed the uncertainty threshold
    - Qdrant or Ollama is unavailable
    """
    if _check_injection(query):
        return []

    try:
        vector = await embed_text(query)
    except Exception:
        return []

    try:
        client = AsyncQdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
        )

        search_filter = None
        if topics:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="topic",
                        match=MatchAny(any=topics),
                    )
                ]
            )

        results = await client.search(
            collection_name=COLLECTION,
            query_vector=vector,
            query_filter=search_filter,
            limit=top_k,
            score_threshold=UNCERTAINTY_THRESHOLD,
        )

        return [r.payload.get("text", "") for r in results if r.payload]
    except Exception:
        return []
