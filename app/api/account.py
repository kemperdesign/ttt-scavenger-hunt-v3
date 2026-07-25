"""
GDPR-style account endpoints: data export and account deletion.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.session import GameSession
from app.models.badge import UserBadge
from app.models.submission import PhotoSubmission
from app.auth.deps import get_current_user

router = APIRouter()


class AccountDataExport(BaseModel):
    user: dict
    sessions: list[dict]
    badges: list[dict]
    photo_submissions: list[dict]
    exported_at: str


@router.get("/export", response_model=AccountDataExport)
async def export_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all data associated with the current user account."""
    # Sessions
    sess_result = await db.execute(
        select(GameSession).where(GameSession.user_id == current_user.id)
    )
    sessions = sess_result.scalars().all()

    # Badges
    badge_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == current_user.id)
    )
    user_badges = badge_result.scalars().all()

    # Photo submissions
    sub_result = await db.execute(
        select(PhotoSubmission).where(PhotoSubmission.user_id == current_user.id)
    )
    submissions = sub_result.scalars().all()

    return AccountDataExport(
        user={
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "is_admin": current_user.is_admin,
            "created_at": current_user.created_at.isoformat(),
        },
        sessions=[
            {
                "id": str(s.id),
                "adventure_id": str(s.adventure_id),
                "status": s.status,
                "total_points": s.total_points,
                "is_complete": s.is_complete,
                "started_at": s.started_at.isoformat(),
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in sessions
        ],
        badges=[
            {
                "badge_id": str(b.badge_id),
                "earned_at": b.earned_at.isoformat(),
            }
            for b in user_badges
        ],
        photo_submissions=[
            {
                "id": str(s.id),
                "challenge_id": str(s.challenge_id),
                "status": s.status,
                "image_url": s.image_url,
                "submitted_at": s.submitted_at.isoformat(),
            }
            for s in submissions
        ],
        exported_at=datetime.utcnow().isoformat(),
    )


@router.delete("/delete", status_code=204)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete the current user account and all associated data.
    Cascades via FK constraints on sessions, badges, submissions.
    """
    await db.delete(current_user)
    await db.flush()
    return None
