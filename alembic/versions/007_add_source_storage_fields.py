"""Add minio_key and chunk_count to source_documents

Revision ID: 007
Revises: 006
Create Date: 2026-07-29
"""

from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "source_documents",
        sa.Column("minio_key", sa.String(500), nullable=True),
    )
    op.add_column(
        "source_documents",
        sa.Column("chunk_count", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("source_documents", "chunk_count")
    op.drop_column("source_documents", "minio_key")
