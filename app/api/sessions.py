"""
Game session management. No login required for player endpoints —
the session UUID is the secret. Auth only required for admin tools.
"""

from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.session import GameSession
from app.models.adventure import Adventure
from app.models.user import User
from app.auth.deps import get_optional_user, get_current_admin

router = APIRouter()


class SessionCreate(BaseModel):
    adventure_id: str
    team_id: Optional[str] = None
    is_preview: bool = False


class AwardPointsRequest(BaseModel):
    points: int


class SessionOut(BaseModel):
    id: str
    adventure_id: str
    user_id: Optional[str]
    team_id: Optional[str]
    status: str
    current_stop_index: int
    total_points: int
    completed_stop_ids: List[str]
    completed_challenge_ids: List[str]
    hints_used: int
    is_complete: bool
    is_preview: bool
    payment_status: str
    completed_at: Optional[datetime]
    started_at: datetime

    class Config:
        from_attributes = True


def _to_out(s: GameSession) -> SessionOut:
    return SessionOut(
        id=str(s.id),
        adventure_id=str(s.adventure_id),
        user_id=str(s.user_id) if s.user_id else None,
        team_id=str(s.team_id) if s.team_id else None,
        status=s.status,
        current_stop_index=s.current_stop_index,
        total_points=s.total_points,
        completed_stop_ids=s.completed_stop_ids or [],
        completed_challenge_ids=s.completed_challenge_ids or [],
        hints_used=s.hints_used,
        is_complete=s.is_complete,
        is_preview=s.is_preview,
        payment_status=s.payment_status,
        completed_at=s.completed_at,
        started_at=s.started_at,
    )


@router.post("", response_model=SessionOut, status_code=201)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    adventure_id = UUID(body.adventure_id)
    adv_result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    if not adv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Adventure not found")

    is_preview = body.is_preview and current_user is not None and current_user.is_admin

    session = GameSession(
        user_id=current_user.id if current_user else None,
        adventure_id=adventure_id,
        team_id=UUID(body.team_id) if body.team_id else None,
        is_preview=is_preview,
    )
    db.add(session)
    await db.flush()
    return _to_out(session)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _to_out(session)


@router.post("/{session_id}/complete", response_model=SessionOut)
async def complete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_complete = True
    session.status = "completed"
    session.completed_at = datetime.now(tz=timezone.utc)
    await db.flush()
    return _to_out(session)


@router.post("/{session_id}/reset", response_model=SessionOut)
async def reset_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "active"
    session.current_stop_index = 0
    session.total_points = 0
    session.completed_stop_ids = []
    session.completed_challenge_ids = []
    session.hints_used = 0
    session.is_complete = False
    session.completed_at = None
    await db.flush()
    return _to_out(session)


@router.post("/{session_id}/award-points", response_model=SessionOut)
async def award_test_points(
    session_id: UUID,
    body: AwardPointsRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Admin testing tool only."""
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.total_points = max(0, session.total_points + body.points)
    await db.flush()
    return _to_out(session)
