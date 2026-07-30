"""
Historical source register — admin CRUD, PDF upload, and Qdrant ingestion.
"""

import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.source_document import SourceDocument
from app.auth.deps import get_current_admin
from app.core.config import settings

router = APIRouter()

VALID_RIGHTS = {"public_domain", "cc_licensed", "fair_use", "permission_granted", "unknown"}
VALID_RELIABILITY = {"primary", "peer_reviewed", "secondary", "popular", "unreviewed"}
VALID_REVIEW = {"pending", "approved", "rejected"}


class SourceOut(BaseModel):
    id: int
    title: str
    author: Optional[str]
    publication_date: Optional[str]
    url: Optional[str]
    local_filename: Optional[str]
    rights_status: str
    reliability: str
    locations_covered: List[str]
    periods_covered: List[str]
    review_status: str
    reviewer: Optional[str]
    notes: Optional[str]
    ingested: bool
    minio_key: Optional[str]
    chunk_count: Optional[int]

    class Config:
        from_attributes = True


class SourceCreate(BaseModel):
    title: str
    author: Optional[str] = None
    publication_date: Optional[str] = None
    url: Optional[str] = None
    local_filename: Optional[str] = None
    rights_status: str = "unknown"
    reliability: str = "unreviewed"
    locations_covered: List[str] = []
    periods_covered: List[str] = []
    review_status: str = "pending"
    reviewer: Optional[str] = None
    notes: Optional[str] = None


class SourceUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publication_date: Optional[str] = None
    url: Optional[str] = None
    local_filename: Optional[str] = None
    rights_status: Optional[str] = None
    reliability: Optional[str] = None
    locations_covered: Optional[List[str]] = None
    periods_covered: Optional[List[str]] = None
    review_status: Optional[str] = None
    reviewer: Optional[str] = None
    notes: Optional[str] = None
    ingested: Optional[bool] = None


def _validate_enums(data: dict) -> None:
    if "rights_status" in data and data["rights_status"] not in VALID_RIGHTS:
        raise HTTPException(status_code=422, detail=f"rights_status must be one of {sorted(VALID_RIGHTS)}")
    if "reliability" in data and data["reliability"] not in VALID_RELIABILITY:
        raise HTTPException(status_code=422, detail=f"reliability must be one of {sorted(VALID_RELIABILITY)}")
    if "review_status" in data and data["review_status"] not in VALID_REVIEW:
        raise HTTPException(status_code=422, detail=f"review_status must be one of {sorted(VALID_REVIEW)}")


@router.get("", response_model=List[SourceOut])
async def list_sources(
    review_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = select(SourceDocument).order_by(SourceDocument.title)
    if review_status:
        q = q.where(SourceDocument.review_status == review_status)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=SourceOut, status_code=201)
async def create_source(
    body: SourceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    data = body.model_dump()
    _validate_enums(data)
    source = SourceDocument(**data)
    db.add(source)
    await db.flush()
    return source


@router.get("/{source_id}", response_model=SourceOut)
async def get_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(SourceDocument).where(SourceDocument.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.patch("/{source_id}", response_model=SourceOut)
async def update_source(
    source_id: int,
    body: SourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(SourceDocument).where(SourceDocument.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    data = body.model_dump(exclude_none=True)
    _validate_enums(data)
    for field, value in data.items():
        setattr(source, field, value)

    await db.flush()
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(SourceDocument).where(SourceDocument.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.delete(source)
    await db.flush()
    return None


@router.post("/{source_id}/upload", response_model=SourceOut)
async def upload_source_pdf(
    source_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Upload a PDF for a source document and store it in MinIO."""
    result = await db.execute(select(SourceDocument).where(SourceDocument.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Only PDF files are accepted")

    try:
        import boto3
        from botocore.client import Config as BotoConfig

        s3 = boto3.client(
            "s3",
            endpoint_url=f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=BotoConfig(signature_version="s3v4"),
        )

        key = f"sources/{source_id}/{file.filename}"
        contents = await file.read()
        s3.upload_fileobj(
            io.BytesIO(contents),
            settings.MINIO_BUCKET,
            key,
            ExtraArgs={"ContentType": "application/pdf"},
        )
        source.minio_key = key
        source.local_filename = file.filename
        await db.flush()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    return source


@router.post("/{source_id}/ingest", response_model=SourceOut)
async def ingest_source(
    source_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Download source PDF from MinIO and ingest chunks into Qdrant."""
    result = await db.execute(select(SourceDocument).where(SourceDocument.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if not source.minio_key:
        raise HTTPException(status_code=422, detail="No file uploaded for this source — upload a PDF first")

    try:
        import tempfile
        import boto3
        from botocore.client import Config as BotoConfig
        from app.ai.ingest import ingest_file

        s3 = boto3.client(
            "s3",
            endpoint_url=f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=BotoConfig(signature_version="s3v4"),
        )

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            s3.download_fileobj(settings.MINIO_BUCKET, source.minio_key, tmp)
            tmp_path = tmp.name

        topic = (source.periods_covered or ["st_augustine"])[0]
        chunk_count = ingest_file(
            path=tmp_path,
            topic=topic,
            source_title=source.title,
        )

        source.ingested = True
        source.chunk_count = chunk_count
        await db.flush()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    return source
