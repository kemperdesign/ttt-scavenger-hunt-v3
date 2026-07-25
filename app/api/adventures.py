"""
Adventures CRUD + leaderboard.
"""

import math
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.models.adventure import Adventure
from app.models.session import GameSession
from app.models.user import User
from app.auth.deps import get_current_user, get_current_admin

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdventureBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    difficulty: str = "moderate"
    estimated_duration_minutes: int = 90
    cover_image_url: Optional[str] = None
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    tags: List[str] = []


class AdventureCreate(AdventureBase):
    pass


class AdventureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    cover_image_url: Optional[str] = None
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None


class AdventureOut(AdventureBase):
    id: str
    is_published: bool
    is_featured: bool
    total_points: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_points: int
    completed_at: Optional[datetime]


class TeamLeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    member_count: int
    total_points: int
    completed_at: Optional[datetime]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_out(a: Adventure) -> AdventureOut:
    return AdventureOut(
        id=str(a.id),
        title=a.title,
        slug=a.slug,
        description=a.description,
        short_description=a.short_description,
        difficulty=a.difficulty,
        estimated_duration_minutes=a.estimated_duration_minutes,
        cover_image_url=a.cover_image_url,
        start_lat=a.start_lat,
        start_lng=a.start_lng,
        tags=a.tags or [],
        is_published=a.is_published,
        is_featured=a.is_featured,
        total_points=a.total_points,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[AdventureOut])
async def list_adventures(
    published_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    q = select(Adventure)
    if published_only:
        q = q.where(Adventure.is_published == True)
    q = q.order_by(Adventure.is_featured.desc(), Adventure.created_at.desc())
    result = await db.execute(q)
    return [_to_out(a) for a in result.scalars().all()]


@router.post("", response_model=AdventureOut, status_code=201)
async def create_adventure(
    body: AdventureCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    adventure = Adventure(**body.model_dump())
    db.add(adventure)
    await db.flush()
    return _to_out(adventure)


@router.get("/{adventure_id}", response_model=AdventureOut)
async def get_adventure(adventure_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    return _to_out(adventure)


@router.patch("/{adventure_id}", response_model=AdventureOut)
async def update_adventure(
    adventure_id: UUID,
    body: AdventureUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(adventure, field, value)

    await db.flush()
    return _to_out(adventure)


@router.delete("/{adventure_id}", status_code=204)
async def delete_adventure(
    adventure_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    await db.delete(adventure)
    await db.flush()


@router.post("/{adventure_id}/publish", response_model=AdventureOut)
async def publish_adventure(
    adventure_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    adventure.is_published = True
    await db.flush()
    return _to_out(adventure)


@router.post("/{adventure_id}/unpublish", response_model=AdventureOut)
async def unpublish_adventure(
    adventure_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    adventure.is_published = False
    await db.flush()
    return _to_out(adventure)


@router.get("/{adventure_id}/leaderboard")
async def get_leaderboard(
    adventure_id: UUID,
    type: str = "player",
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """
    Get adventure leaderboard.

    type: "player" for individual rankings, "team" for team rankings
    """
    if type == "team":
        from app.models.team import Team, TeamMember

        result = await db.execute(
            select(Team, func.count(TeamMember.id).label("member_count"))
            .outerjoin(TeamMember)
            .where(Team.adventure_id == adventure_id)
            .group_by(Team.id)
            .order_by(Team.total_points.desc())
            .limit(limit)
        )
        rows = result.all()
        return [
            TeamLeaderboardEntry(
                rank=i + 1,
                team_name=team.name,
                member_count=member_count or 0,
                total_points=team.total_points,
                completed_at=None,
            )
            for i, (team, member_count) in enumerate(rows)
        ]
    else:
        result = await db.execute(
            select(GameSession, User)
            .join(User, GameSession.user_id == User.id)
            .where(
                GameSession.adventure_id == adventure_id,
                GameSession.is_complete == True,
                GameSession.is_preview == False,
            )
            .order_by(GameSession.total_points.desc(), GameSession.completed_at.asc())
            .limit(limit)
        )
        rows = result.all()
        return [
            LeaderboardEntry(
                rank=i + 1,
                username=user.username,
                total_points=session.total_points,
                completed_at=session.completed_at,
            )
            for i, (session, user) in enumerate(rows)
        ]
