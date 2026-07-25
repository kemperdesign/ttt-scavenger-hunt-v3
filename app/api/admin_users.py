"""
Admin user management: list users, toggle admin role and active status.
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.auth.deps import get_current_admin
from app.utils.audit import log_action

router = APIRouter()


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


def _to_out(u: User) -> UserOut:
    return UserOut(
        id=str(u.id),
        email=u.email,
        username=u.username,
        is_admin=u.is_admin,
        is_active=u.is_active,
        created_at=u.created_at,
    )


@router.get("", response_model=List[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return [_to_out(u) for u in result.scalars().all()]


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(admin.id) and (
        (body.is_admin is False) or (body.is_active is False)
    ):
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin access or deactivate your own account",
        )

    changes = {}
    if body.is_admin is not None and body.is_admin != user.is_admin:
        changes["is_admin"] = {"from": user.is_admin, "to": body.is_admin}
        user.is_admin = body.is_admin
    if body.is_active is not None and body.is_active != user.is_active:
        changes["is_active"] = {"from": user.is_active, "to": body.is_active}
        user.is_active = body.is_active

    if changes:
        await log_action(
            db,
            action="admin.user_updated",
            user_id=admin.id,
            resource_type="user",
            resource_id=str(user.id),
            details=changes,
            request=request,
        )

    await db.flush()
    return _to_out(user)
