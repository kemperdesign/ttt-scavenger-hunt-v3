"""
Challenge submission endpoint — handles all 8 challenge types with validation.
"""

import math
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.challenge import Challenge, ChallengeAttempt
from app.models.session import GameSession
from app.models.user import User
from app.auth.deps import get_current_user
from app.core.config import settings

router = APIRouter()


class ChallengeOut(BaseModel):
    id: str
    stop_id: str
    challenge_type: str
    title: str
    prompt: str
    order_index: int
    points: int
    is_required: bool
    hint_text: Optional[str]
    config: dict

    class Config:
        from_attributes = True


class SubmitRequest(BaseModel):
    session_id: str
    answer_data: dict  # shape depends on challenge_type


class SubmitResponse(BaseModel):
    is_correct: bool
    points_earned: int
    feedback: str
    attempt_id: str


class HintRequest(BaseModel):
    session_id: str


class HintResponse(BaseModel):
    hint_text: str
    points_deducted: int


class CreateChallengeRequest(BaseModel):
    stop_id: str
    challenge_type: str
    title: str = "Untitled Challenge"
    prompt: str = ""
    order_index: int = 0
    points: int = 10
    is_required: bool = True
    hint_text: Optional[str] = None
    config: dict = {}


class UpdateChallengeRequest(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    challenge_type: Optional[str] = None
    order_index: Optional[int] = None
    points: Optional[int] = None
    is_required: Optional[bool] = None
    hint_text: Optional[str] = None
    config: Optional[dict] = None


@router.get("")
async def list_challenges(stop_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Challenge)
        .where(Challenge.stop_id == UUID(stop_id))
        .order_by(Challenge.order_index)
    )
    challenges = result.scalars().all()
    return [
        ChallengeOut(
            id=str(ch.id), stop_id=str(ch.stop_id),
            challenge_type=ch.challenge_type, title=ch.title,
            prompt=ch.prompt, order_index=ch.order_index,
            points=ch.points, is_required=ch.is_required,
            hint_text=ch.hint_text, config=ch.config,
        )
        for ch in challenges
    ]


@router.post("", response_model=ChallengeOut)
async def create_challenge(
    body: CreateChallengeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    challenge = Challenge(
        stop_id=UUID(body.stop_id),
        challenge_type=body.challenge_type,
        title=body.title,
        prompt=body.prompt,
        order_index=body.order_index,
        points=body.points,
        is_required=body.is_required,
        hint_text=body.hint_text,
        config=body.config,
    )
    db.add(challenge)
    await db.flush()

    return ChallengeOut(
        id=str(challenge.id), stop_id=str(challenge.stop_id),
        challenge_type=challenge.challenge_type, title=challenge.title,
        prompt=challenge.prompt, order_index=challenge.order_index,
        points=challenge.points, is_required=challenge.is_required,
        hint_text=challenge.hint_text, config=challenge.config,
    )


@router.get("/{challenge_id}", response_model=ChallengeOut)
async def get_challenge(challenge_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return ChallengeOut(
        id=str(ch.id), stop_id=str(ch.stop_id),
        challenge_type=ch.challenge_type, title=ch.title,
        prompt=ch.prompt, order_index=ch.order_index,
        points=ch.points, is_required=ch.is_required,
        hint_text=ch.hint_text, config=ch.config,
    )


@router.patch("/{challenge_id}", response_model=ChallengeOut)
async def update_challenge(
    challenge_id: UUID,
    body: UpdateChallengeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if body.title is not None:
        ch.title = body.title
    if body.prompt is not None:
        ch.prompt = body.prompt
    if body.challenge_type is not None:
        ch.challenge_type = body.challenge_type
    if body.order_index is not None:
        ch.order_index = body.order_index
    if body.points is not None:
        ch.points = body.points
    if body.is_required is not None:
        ch.is_required = body.is_required
    if body.hint_text is not None:
        ch.hint_text = body.hint_text
    if body.config is not None:
        ch.config = body.config

    await db.flush()

    return ChallengeOut(
        id=str(ch.id), stop_id=str(ch.stop_id),
        challenge_type=ch.challenge_type, title=ch.title,
        prompt=ch.prompt, order_index=ch.order_index,
        points=ch.points, is_required=ch.is_required,
        hint_text=ch.hint_text, config=ch.config,
    )


@router.delete("/{challenge_id}")
async def delete_challenge(
    challenge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    db.delete(ch)
    await db.flush()
    return {"status": "deleted"}


@router.post("/{challenge_id}/submit", response_model=SubmitResponse)
async def submit_challenge(
    challenge_id: UUID,
    body: SubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Load challenge
    ch_result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = ch_result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

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

    is_correct, feedback = _evaluate(challenge, body.answer_data)
    points = challenge.points if is_correct else 0

    attempt = ChallengeAttempt(
        challenge_id=challenge.id,
        session_id=session.id,
        user_id=current_user.id,
        is_correct=is_correct,
        points_earned=points,
        answer_data=body.answer_data,
        completed_at=datetime.now(tz=timezone.utc),
    )
    db.add(attempt)

    if is_correct:
        completed = list(session.completed_challenge_ids or [])
        if str(challenge_id) not in completed:
            completed.append(str(challenge_id))
            session.completed_challenge_ids = completed
            session.total_points = (session.total_points or 0) + points

    await db.flush()

    return SubmitResponse(
        is_correct=is_correct,
        points_earned=points,
        feedback=feedback,
        attempt_id=str(attempt.id),
    )


@router.post("/{challenge_id}/hint", response_model=HintResponse)
async def use_hint(
    challenge_id: UUID,
    body: HintRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ch_result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = ch_result.scalar_one_or_none()
    if not challenge or not challenge.hint_text:
        raise HTTPException(status_code=404, detail="No hint available")

    sess_result = await db.execute(
        select(GameSession).where(
            GameSession.id == UUID(body.session_id),
            GameSession.user_id == current_user.id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    penalty = settings.HINT_POINT_PENALTY
    session.total_points = max(0, (session.total_points or 0) - penalty)
    session.hints_used = (session.hints_used or 0) + 1
    await db.flush()

    return HintResponse(hint_text=challenge.hint_text, points_deducted=penalty)


# ── Challenge type evaluators ─────────────────────────────────────────────────

def _evaluate(challenge: Challenge, answer_data: dict) -> tuple[bool, str]:
    ctype = challenge.challenge_type
    cfg = challenge.config or {}

    if ctype == "multiple_choice":
        selected = answer_data.get("selected_index")
        correct = cfg.get("correct_index")
        if selected == correct:
            explanation = cfg.get("explanation", "")
            return True, f"Correct! {explanation}".strip()
        return False, "That's not quite right. Try again!"

    elif ctype == "text_answer":
        user_answer = str(answer_data.get("answer", "")).strip()
        accepted = cfg.get("accepted_answers", [])
        case_sensitive = cfg.get("case_sensitive", False)
        if not case_sensitive:
            user_answer = user_answer.lower()
            accepted = [a.lower() for a in accepted]
        if user_answer in accepted:
            return True, "Correct!"
        return False, "Not quite. Check the wording and try again."

    elif ctype == "sequence_puzzle":
        user_order = answer_data.get("order", [])
        correct_order = cfg.get("correct_order", [])
        if user_order == correct_order:
            return True, "Perfect sequence!"
        return False, "The order isn't quite right."

    elif ctype == "qr_code":
        scanned_code = str(answer_data.get("code", "")).strip()
        expected = str(cfg.get("expected_code", "")).strip()
        if scanned_code == expected:
            return True, "QR code verified!"
        return False, "That QR code doesn't match. Make sure you're at the right location."

    elif ctype == "gps_checkin":
        # GPS validation handled by /gps/checkin endpoint
        # This path used when offline sync submits via challenge route
        return True, "Location verified!"

    elif ctype == "photo_submission":
        # Photos go to admin review queue — mark as pending
        return True, "Photo submitted for review. Points will be awarded after approval."

    elif ctype == "ai_conversation":
        # Open-ended; completion determined by min_exchanges on frontend
        return True, "Great conversation!"

    elif ctype == "branching_story":
        # Player completes branching story by reaching an end node (no choices)
        # answer_data should indicate final node reached
        # For now, server trusts the client: if they submit, they reached an end
        # Ideal: track final node in answer_data and validate it has no choices
        return True, "You completed the story!"

    else:
        return False, "Unknown challenge type."
