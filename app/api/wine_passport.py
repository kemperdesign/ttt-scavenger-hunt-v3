"""
Wine Passport endpoints: get stamps, add stamp, remove stamp.
Authenticated — stamps are tied to the logged-in user.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.wine_passport import WinePassportStamp
from app.models.user import User
from app.auth.deps import get_current_user

router = APIRouter()

VALID_VENUE_IDS = {
    "san_sebastian",
    "café_del_hidalgo",
    "preserved",
    "collage",
    "casa_monica",
    "white_lion",
}


class StampOut(BaseModel):
    venue_id: str
    stamped_at: datetime

    class Config:
        from_attributes = True


class StampRequest(BaseModel):
    venue_id: str


@router.get("", response_model=list[StampOut])
async def get_stamps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WinePassportStamp).where(WinePassportStamp.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("", response_model=StampOut, status_code=201)
async def add_stamp(
    body: StampRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.venue_id not in VALID_VENUE_IDS:
        raise HTTPException(status_code=400, detail="Unknown venue_id")

    existing = await db.execute(
        select(WinePassportStamp).where(
            WinePassportStamp.user_id == current_user.id,
            WinePassportStamp.venue_id == body.venue_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already stamped")

    stamp = WinePassportStamp(user_id=current_user.id, venue_id=body.venue_id)
    db.add(stamp)
    await db.commit()
    await db.refresh(stamp)
    return stamp


@router.delete("/{venue_id}", status_code=204)
async def remove_stamp(
    venue_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        delete(WinePassportStamp).where(
            WinePassportStamp.user_id == current_user.id,
            WinePassportStamp.venue_id == venue_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Stamp not found")
