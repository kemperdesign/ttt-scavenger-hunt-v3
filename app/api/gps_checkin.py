"""
GPS check-in endpoint — server-side haversine validation with simulated GPS support.
"""

import math
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.stop import Stop
from app.models.session import GameSession
from app.models.user import User
from app.auth.deps import get_current_user
from app.core.config import settings

router = APIRouter()


class CheckinRequest(BaseModel):
    stop_id: str
    session_id: str
    lat: float
    lng: float
    accuracy_meters: float | None = None
    simulated: bool = False


class CheckinResponse(BaseModel):
    success: bool
    distance_meters: float
    required_radius: float
    message: str


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Returns distance in meters between two lat/lng points."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@router.post("/checkin", response_model=CheckinResponse)
async def gps_checkin(
    body: CheckinRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Block simulated GPS in production
    if body.simulated and not settings.ALLOW_SIMULATED_GPS:
        raise HTTPException(status_code=403, detail="Simulated GPS is not allowed")

    # Load stop
    stop_result = await db.execute(select(Stop).where(Stop.id == UUID(body.stop_id)))
    stop = stop_result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")

    # Load session
    sess_result = await db.execute(
        select(GameSession).where(
            GameSession.id == UUID(body.session_id),
            GameSession.user_id == current_user.id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Payment gate — stop index ≥ 1 requires a paid or corporate session
    # (preview sessions bypass payment so admins can walk through freely)
    if stop.order_index >= 1 and not session.is_preview:
        if session.payment_status not in ("paid", "corporate"):
            raise HTTPException(
                status_code=402,
                detail="payment_required",
            )

    distance = haversine(body.lat, body.lng, stop.lat, stop.lng)
    radius = stop.gps_radius_meters or settings.DEFAULT_GPS_RADIUS_METERS

    # For simulated GPS, skip distance check entirely
    if body.simulated:
        distance = 0.0

    success = distance <= radius

    if success:
        # Mark stop as completed
        completed = list(session.completed_stop_ids or [])
        stop_id_str = str(stop.id)
        if stop_id_str not in completed:
            completed.append(stop_id_str)
            session.completed_stop_ids = completed
            session.total_points = (session.total_points or 0) + stop.points
            session.current_stop_index = len(completed)
        await db.flush()

    return CheckinResponse(
        success=success,
        distance_meters=round(distance, 1),
        required_radius=radius,
        message="Check-in successful!" if success else f"You're {round(distance)}m away. Get closer!",
    )
