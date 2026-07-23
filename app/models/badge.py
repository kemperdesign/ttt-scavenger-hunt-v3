import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adventure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("adventures.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str] = mapped_column(String(500), nullable=True)
    icon_emoji: Mapped[str] = mapped_column(String(10), nullable=True)  # fallback emoji
    # trigger_condition: JSON describing when the badge is awarded
    # e.g. {"type": "adventure_complete", "adventure_id": "..."}
    # e.g. {"type": "all_hints_skipped"}
    # e.g. {"type": "speed_run", "max_minutes": 45}
    trigger_condition: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    adventure: Mapped["Adventure"] = relationship("Adventure", back_populates="badges")
    user_badges: Mapped[list["UserBadge"]] = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="SET NULL"), nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="badges")
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_badges")
