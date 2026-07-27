"""
Document ingestion pipeline:
  1. Extract text from PDF / HTML / plain text
  2. Chunk into 400-token segments with 50-token overlap
  3. Embed each chunk via OpenAI
  4. Upsert into Qdrant
"""

import re
import uuid
import asyncio
from pathlib import Path
from typing import Generator

import httpx
import pdfplumber
from bs4 import BeautifulSoup
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct, CollectionStatus
)

from app.core.config import settings

COLLECTION = settings.QDRANT_COLLECTION
CHUNK_SIZE = 400      # tokens (approximate: 1 token ≈ 4 chars)
CHUNK_OVERLAP = 50
EMBED_DIM = settings.OPENAI_EMBED_DIM


# ── Text extraction ──────────────────────────────────────────────────────────

def extract_pdf(path: str) -> str:
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n\n".join(text_parts)


def extract_html(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        soup = BeautifulSoup(f.read(), "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n")


def extract_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def extract(path: str) -> str:
    p = Path(path)
    if p.suffix.lower() == ".pdf":
        return extract_pdf(path)
    elif p.suffix.lower() in (".html", ".htm"):
        return extract_html(path)
    else:
        return extract_text(path)


# ── Chunking ─────────────────────────────────────────────────────────────────

def _approx_tokens(text: str) -> int:
    return len(text) // 4


def chunk_text(text: str, chunk_tokens: int = CHUNK_SIZE, overlap_tokens: int = CHUNK_OVERLAP) -> Generator[str, None, None]:
    """Yield overlapping chunks of approximately chunk_tokens each."""
    chunk_chars = chunk_tokens * 4
    overlap_chars = overlap_tokens * 4

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    start = 0
    while start < len(text):
        end = start + chunk_chars
        chunk = text[start:end]
        if chunk.strip():
            yield chunk.strip()
        start += chunk_chars - overlap_chars


# ── Embedding ─────────────────────────────────────────────────────────────────

def embed_sync(text: str) -> list[float]:
    response = httpx.post(
        "https://api.openai.com/v1/embeddings",
        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
        json={
            "model": settings.OPENAI_EMBED_MODEL,
            "input": text,
            "dimensions": settings.OPENAI_EMBED_DIM,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]


# ── Qdrant upsert ─────────────────────────────────────────────────────────────

def ensure_collection(client: QdrantClient) -> None:
    collections = client.get_collections().collections
    names = [c.name for c in collections]
    if COLLECTION not in names:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )
        print(f"Created Qdrant collection: {COLLECTION}")


def ingest_file(
    path: str,
    topic: str,
    source_title: str,
    client: QdrantClient | None = None,
    batch_size: int = 10,
) -> int:
    """
    Ingest a single file into Qdrant.
    Returns the number of chunks ingested.
    """
    if client is None:
        client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

    ensure_collection(client)

    text = extract(path)
    chunks = list(chunk_text(text))
    total = len(chunks)
    print(f"  Ingesting {total} chunks from {Path(path).name} (topic={topic})")

    points = []
    for i, chunk in enumerate(chunks):
        try:
            vector = embed_sync(chunk)
        except Exception as e:
            print(f"  Embedding error on chunk {i}: {e}")
            continue

        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": chunk,
                "topic": topic,
                "source": source_title,
                "chunk_index": i,
                "source_path": str(path),
            },
        ))

        if len(points) >= batch_size:
            client.upsert(collection_name=COLLECTION, points=points)
            points = []

    if points:
        client.upsert(collection_name=COLLECTION, points=points)

    return total
