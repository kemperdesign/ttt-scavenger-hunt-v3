"""
Team play: create, join, get team.
"""

import random
import string
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.team import Team, TeamMember
from app.models.user import User
from app.auth.deps import get_current_user

router = APIRouter()


def _gen_code(length=6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


class TeamCreate(BaseModel):
    name: str
    adventure_id: str
    max_members: int = 6


class JoinRequest(BaseModel):
    join_code: str


class MemberOut(BaseModel):
    user_id: str
    username: str
    joined_at: datetime


class TeamOut(BaseModel):
    id: str
    name: str
    join_code: str
    adventure_id: str
    leader_id: Optional[str]
    total_points: int
    max_members: int
    members: List[MemberOut]


@router.post("", response_model=TeamOut, status_code=201)
async def create_team(
    body: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = _gen_code()
    # Ensure uniqueness
    while True:
        exists = await db.execute(select(Team).where(Team.join_code == code))
        if not exists.scalar_one_or_none():
            break
        code = _gen_code()

    team = Team(
        name=body.name,
        join_code=code,
        adventure_id=UUID(body.adventure_id),
        leader_id=current_user.id,
        max_members=body.max_members,
    )
    db.add(team)
    await db.flush()

    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    await db.flush()

    return await _load_team(team.id, db)


@router.post("/join", response_model=TeamOut)
async def join_team(
    body: JoinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Team).where(Team.join_code == body.join_code.upper()))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid join code")

    # Check member count
    member_result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team.id)
    )
    members = member_result.scalars().all()
    if len(members) >= team.max_members:
        raise HTTPException(status_code=409, detail="Team is full")

    # Check already a member
    already = any(m.user_id == current_user.id for m in members)
    if not already:
        db.add(TeamMember(team_id=team.id, user_id=current_user.id))
        await db.flush()

    return await _load_team(team.id, db)


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await _load_team(team_id, db)


async def _load_team(team_id: UUID, db: AsyncSession) -> TeamOut:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members_result = await db.execute(
        select(TeamMember, User)
        .join(User, TeamMember.user_id == User.id)
        .where(TeamMember.team_id == team.id)
    )
    member_rows = members_result.all()

    return TeamOut(
        id=str(team.id),
        name=team.name,
        join_code=team.join_code,
        adventure_id=str(team.adventure_id),
        leader_id=str(team.leader_id) if team.leader_id else None,
        total_points=team.total_points,
        max_members=team.max_members,
        members=[
            MemberOut(
                user_id=str(m.user_id),
                username=u.username,
                joined_at=m.joined_at,
            )
            for m, u in member_rows
        ],
    )
