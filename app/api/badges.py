"""
Badge endpoints. list_my_badges requires login; check_badges is session-based (no login).
"""

from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.badge import Badge, UserBadge
from app.models.session import GameSession
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
):
    """
    Check and award new badges for a session. No login required — session_id is the auth.
    Badges are tied to the user_id on the session (null for guests, skips DB write but
    still returns the badge info so the UI can show the celebration screen).
    """
    sess_result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    badges_result = await db.execute(
        select(Badge).where(Badge.adventure_id == session.adventure_id)
    )
    adventure_badges = badges_result.scalars().all()

    # For logged-in users, exclude already-earned badges
    already_earned: set = set()
    if session.user_id:
        earned_result = await db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == session.user_id)
        )
        already_earned = {row[0] for row in earned_result.all()}

    stops_result = await db.execute(select(Stop).where(Stop.adventure_id == session.adventure_id))
    total_stops = len(stops_result.scalars().all())

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
            should_award = session.hints_used == 0
        elif badge_type == "all_stops":
            should_award = len(set(session.completed_stop_ids or [])) >= total_stops

        if should_award:
            # Only persist to DB if the session belongs to a logged-in user
            if session.user_id:
                ub = UserBadge(
                    user_id=session.user_id,
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
