import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stops.id", ondelete="CASCADE"), nullable=False)
    challenge_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Types: gps_checkin, multiple_choice, text_answer, photo_submission,
    #        ai_conversation, sequence_puzzle, qr_code, branching_story
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=10)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    hint_text: Mapped[str] = mapped_column(Text, nullable=True)

    # Type-specific config stored as JSONB
    # multiple_choice: {"options": [...], "correct_index": 0, "explanation": "..."}
    # text_answer: {"accepted_answers": [...], "case_sensitive": false}
    # sequence_puzzle: {"items": [...], "correct_order": [...]}
    # qr_code: {"expected_code": "...", "location_hint": "..."}
    # branching_story: {"branches": {...}, "start_node": "..."}
    # ai_conversation: {"character_id": "...", "min_exchanges": 3, "topic": "..."}
    # gps_checkin: {"radius_override": null}
    # photo_submission: {"requires_review": true, "subject_hint": "..."}
    config: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    stop: Mapped["Stop"] = relationship("Stop", back_populates="challenges")
    attempts: Mapped[list["ChallengeAttempt"]] = relationship("ChallengeAttempt", back_populates="challenge")


class ChallengeAttempt(Base):
    __tablename__ = "challenge_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    answer_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="attempts")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False)
    challenge_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["GameSession"] = relationship("GameSession")
    challenge: Mapped["Challenge"] = relationship("Challenge")
