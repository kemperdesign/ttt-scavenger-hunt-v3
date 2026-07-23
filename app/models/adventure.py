import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base


class Adventure(Base):
    __tablename__ = "adventures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="moderate")  # easy, moderate, hard
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    cover_image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_lat: Mapped[float] = mapped_column(Float, nullable=True)
    start_lng: Mapped[float] = mapped_column(Float, nullable=True)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    stops: Mapped[list["Stop"]] = relationship("Stop", back_populates="adventure", order_by="Stop.order_index")
    sessions: Mapped[list["GameSession"]] = relationship("GameSession", back_populates="adventure")
    badges: Mapped[list["Badge"]] = relationship("Badge", back_populates="adventure")
