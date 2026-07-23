"""
Photo submission admin review queue.
"""

import io
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from PIL import Image

from app.db.session import get_db
from app.models.submission import PhotoSubmission
from app.models.session import GameSession
from app.models.user import User
from app.auth.deps import get_current_user, get_current_admin
from app.core.config import settings
from app.utils.file_validation import validate_image

router = APIRouter()


def _get_minio():
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    )


class SubmissionOut(BaseModel):
    id: str
    user_id: str
    challenge_id: str
    session_id: str
    image_url: str
    status: str
    reviewer_notes: Optional[str]
    submitted_at: datetime


class ReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None


@router.post("", response_model=SubmissionOut, status_code=201)
async def upload_photo(
    challenge_id: str = Form(...),
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate image
    contents = await file.read()
    validate_image(contents, filename=file.filename or "upload.jpg")

    # Strip EXIF and re-encode
    img = Image.open(io.BytesIO(contents))
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85)
    output.seek(0)
    clean_bytes = output.read()

    # Upload to MinIO
    key = f"submissions/{current_user.id}/{challenge_id}/{datetime.utcnow().isoformat()}.jpg"
    try:
        minio = _get_minio()
        minio.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=key,
            Body=clean_bytes,
            ContentType="image/jpeg",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    image_url = f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{key}"

    submission = PhotoSubmission(
        user_id=current_user.id,
        challenge_id=UUID(challenge_id),
        session_id=UUID(session_id),
        image_url=image_url,
        minio_key=key,
    )
    db.add(submission)
    await db.flush()

    return SubmissionOut(
        id=str(submission.id),
        user_id=str(submission.user_id),
        challenge_id=challenge_id,
        session_id=session_id,
        image_url=image_url,
        status=submission.status,
        reviewer_notes=None,
        submitted_at=submission.submitted_at,
    )


@router.get("", response_model=List[SubmissionOut])
async def list_submissions(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = select(PhotoSubmission).order_by(PhotoSubmission.submitted_at.desc())
    if status:
        q = q.where(PhotoSubmission.status == status)
    result = await db.execute(q)
    subs = result.scalars().all()
    return [
        SubmissionOut(
            id=str(s.id),
            user_id=str(s.user_id),
            challenge_id=str(s.challenge_id),
            session_id=str(s.session_id),
            image_url=s.image_url,
            status=s.status,
            reviewer_notes=s.reviewer_notes,
            submitted_at=s.submitted_at,
        )
        for s in subs
    ]


@router.post("/{submission_id}/review", response_model=SubmissionOut)
async def review_submission(
    submission_id: UUID,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(get_current_admin),
):
    result = await db.execute(select(PhotoSubmission).where(PhotoSubmission.id == submission_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    sub.status = "approved" if body.action == "approve" else "rejected"
    sub.reviewer_notes = body.notes
    sub.reviewed_by_id = reviewer.id
    sub.reviewed_at = datetime.utcnow()
    await db.flush()

    return SubmissionOut(
        id=str(sub.id),
        user_id=str(sub.user_id),
        challenge_id=str(sub.challenge_id),
        session_id=str(sub.session_id),
        image_url=sub.image_url,
        status=sub.status,
        reviewer_notes=sub.reviewer_notes,
        submitted_at=sub.submitted_at,
    )
