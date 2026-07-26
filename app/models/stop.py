import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.db.base import Base


class Stop(Base):
    __tablename__ = "stops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adventure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("adventures.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    historical_content: Mapped[str] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[object] = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    gps_radius_meters: Mapped[float] = mapped_column(Float, default=30.0)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    audio_url: Mapped[str] = mapped_column(String(500), nullable=True)
    ai_character_id: Mapped[str] = mapped_column(String(50), nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=10)
    hint_text: Mapped[str] = mapped_column(Text, nullable=True)
    safety_warning: Mapped[str] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    adventure: Mapped["Adventure"] = relationship("Adventure", back_populates="stops")
    challenges: Mapped[list["Challenge"]] = relationship("Challenge", back_populates="stop", order_by="Challenge.order_index")
