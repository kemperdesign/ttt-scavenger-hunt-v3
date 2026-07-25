"""
Stops CRUD.
"""

from uuid import UUID
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.stop import Stop
from app.models.user import User
from app.auth.deps import get_current_admin

router = APIRouter()


class StopBase(BaseModel):
    adventure_id: str
    title: str
    description: Optional[str] = None
    historical_content: Optional[str] = None
    order_index: int = 0
    lat: float
    lng: float
    gps_radius_meters: float = 30.0
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    ai_character_id: Optional[str] = None
    points: int = 10
    hint_text: Optional[str] = None


class StopCreate(StopBase):
    pass


class StopUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    historical_content: Optional[str] = None
    order_index: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    gps_radius_meters: Optional[float] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    ai_character_id: Optional[str] = None
    points: Optional[int] = None
    hint_text: Optional[str] = None


class StopOut(StopBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def _to_out(s: Stop) -> StopOut:
    return StopOut(
        id=str(s.id),
        adventure_id=str(s.adventure_id),
        title=s.title,
        description=s.description,
        historical_content=s.historical_content,
        order_index=s.order_index,
        lat=s.lat,
        lng=s.lng,
        gps_radius_meters=s.gps_radius_meters,
        image_url=s.image_url,
        audio_url=s.audio_url,
        ai_character_id=s.ai_character_id,
        points=s.points,
        hint_text=s.hint_text,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("", response_model=List[StopOut])
async def list_stops(adventure_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stop).where(Stop.adventure_id == adventure_id).order_by(Stop.order_index)
    )
    return [_to_out(s) for s in result.scalars().all()]


@router.post("", response_model=StopOut, status_code=201)
async def create_stop(
    body: StopCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    data = body.model_dump()
    data["adventure_id"] = UUID(data["adventure_id"])
    stop = Stop(**data)
    db.add(stop)
    await db.flush()
    return _to_out(stop)


@router.get("/{stop_id}", response_model=StopOut)
async def get_stop(stop_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    return _to_out(stop)


@router.patch("/{stop_id}", response_model=StopOut)
async def update_stop(
    stop_id: UUID,
    body: StopUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(stop, field, value)
    await db.flush()
    return _to_out(stop)


@router.delete("/{stop_id}", status_code=204)
async def delete_stop(
    stop_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    db.delete(stop)
    await db.flush()
