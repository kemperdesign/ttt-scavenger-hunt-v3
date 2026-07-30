"""Add wine_passport_stamps table

Revision ID: 008
Revises: 007
Create Date: 2026-07-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "wine_passport_stamps",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("venue_id", sa.String(100), nullable=False),
        sa.Column("stamped_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "venue_id", name="uq_wine_stamp_user_venue"),
    )
    op.create_index("ix_wine_passport_stamps_user_id", "wine_passport_stamps", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_wine_passport_stamps_user_id", table_name="wine_passport_stamps")
    op.drop_table("wine_passport_stamps")
