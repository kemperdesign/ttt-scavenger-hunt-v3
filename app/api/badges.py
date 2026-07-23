"""
Badge endpoints: list badges, check and award new badges after a session.
"""

from uuid import UUID
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.badge import Badge, UserBadge
from app.models.session import GameSession
from app.models.adventure import Adventure
from app.models.stop import Stop
from app.models.user import User
from app.auth.deps import get_current_user

router = APIRouter()


class BadgeOut(BaseModel):
    id: str
    name: str
    description: str | None
    icon_url: str | None
    icon_emoji: str | None
    adventure_id: str | None
    earned_at: datetime | None = None


@router.get("", response_model=List[BadgeOut])
async def list_my_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Badge, UserBadge.earned_at)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
    )
    return [
        BadgeOut(
            id=str(badge.id),
            name=badge.name,
            description=badge.description,
            icon_url=badge.icon_url,
            icon_emoji=badge.icon_emoji,
            adventure_id=str(badge.adventure_id) if badge.adventure_id else None,
            earned_at=earned_at,
        )
        for badge, earned_at in result.all()
    ]


@router.post("/check/{session_id}", response_model=List[BadgeOut])
async def check_badges(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if any new badges should be awarded for a session.
    Call this after completing the adventure or a significant milestone.
    Returns newly awarded badges.
    """
    sess_result = await db.execute(
        select(GameSession).where(
            GameSession.id == session_id,
            GameSession.user_id == current_user.id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load badges for this adventure
    badges_result = await db.execute(
        select(Badge).where(Badge.adventure_id == session.adventure_id)
    )
    adventure_badges = badges_result.scalars().all()

    # Load already-earned badge IDs for this user
    earned_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == current_user.id)
    )
    already_earned = {row[0] for row in earned_result.all()}

    # Load stop count for the adventure
    stops_result = await db.execute(
        select(Stop).where(Stop.adventure_id == session.adventure_id)
    )
    all_stops = stops_result.scalars().all()
    total_stops = len(all_stops)

    newly_awarded = []

    for badge in adventure_badges:
        if badge.id in already_earned:
            continue

        condition = badge.trigger_condition or {}
        badge_type = condition.get("type")
        should_award = False

        if badge_type == "adventure_complete" and session.is_complete:
            should_award = True

        elif badge_type == "speed_run" and session.is_complete:
            max_minutes = condition.get("max_minutes", 60)
            if session.completed_at and session.started_at:
                elapsed = (session.completed_at - session.started_at).total_seconds() / 60
                should_award = elapsed <= max_minutes

        elif badge_type == "no_hints" and session.is_complete:
            should_award = session.hints_used == 0

        elif badge_type == "perfect_score" and session.is_complete:
            # Check all required challenges were answered correctly with no hints
            should_award = session.hints_used == 0

        elif badge_type == "all_stops":
            completed_stops = set(session.completed_stop_ids or [])
            should_award = len(completed_stops) >= total_stops

        if should_award:
            ub = UserBadge(
                user_id=current_user.id,
                badge_id=badge.id,
                session_id=session.id,
            )
            db.add(ub)
            newly_awarded.append(BadgeOut(
                id=str(badge.id),
                name=badge.name,
                description=badge.description,
                icon_url=badge.icon_url,
                icon_emoji=badge.icon_emoji,
                adventure_id=str(badge.adventure_id) if badge.adventure_id else None,
                earned_at=datetime.utcnow(),
            ))

    await db.flush()
    return newly_awarded
