"""Add source_documents table for historical source register.

Revision ID: 005_add_source_documents
Revises: 004_add_stop_safety_warning
Create Date: 2026-07-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '005_add_source_documents'
down_revision = '004_add_stop_safety_warning'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'source_documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('author', sa.String(200), nullable=True),
        sa.Column('publication_date', sa.String(50), nullable=True),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('local_filename', sa.String(300), nullable=True),
        sa.Column('rights_status', sa.String(50), nullable=False, server_default='unknown'),
        sa.Column('reliability', sa.String(50), nullable=False, server_default='unreviewed'),
        sa.Column('locations_covered', JSONB(), nullable=True, server_default='[]'),
        sa.Column('periods_covered', JSONB(), nullable=True, server_default='[]'),
        sa.Column('review_status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('reviewer', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('ingested', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('source_documents')
