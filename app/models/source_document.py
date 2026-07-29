from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    author: Mapped[str | None] = mapped_column(String(200), nullable=True)
    publication_date: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "1998", "1998-04", "1998-04-12"
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_filename: Mapped[str | None] = mapped_column(String(300), nullable=True)  # relative to data/sources/
    rights_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="unknown"
    )  # public_domain | cc_licensed | fair_use | permission_granted | unknown
    reliability: Mapped[str] = mapped_column(
        String(50), nullable=False, default="unreviewed"
    )  # primary | peer_reviewed | secondary | popular | unreviewed
    locations_covered: Mapped[list] = mapped_column(JSONB, default=list)   # ["Castillo de San Marcos", ...]
    periods_covered: Mapped[list] = mapped_column(JSONB, default=list)     # ["Spanish colonial", "British period", ...]
    review_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )  # pending | approved | rejected
    reviewer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingested: Mapped[bool] = mapped_column(default=False)  # True once run through ingest pipeline
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
