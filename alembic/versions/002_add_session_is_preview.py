"""Add is_preview column to game_sessions for admin preview-as-player mode.

Revision ID: 002_add_session_is_preview
Revises: 001_add_conversation_messages
Create Date: 2026-07-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_session_is_preview'
down_revision = '001_add_conversation_messages'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'game_sessions',
        sa.Column('is_preview', sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    op.drop_column('game_sessions', 'is_preview')
