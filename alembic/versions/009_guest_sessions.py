"""Make user_id nullable for guest (no-login) sessions

Revision ID: 009
Revises: 008
Create Date: 2026-07-30
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # game_sessions.user_id — allow NULL for guest sessions
    op.alter_column("game_sessions", "user_id", nullable=True)

    # challenge_attempts.user_id — allow NULL for guest attempts
    op.alter_column("challenge_attempts", "user_id", nullable=True)

    # conversation_messages.user_id — allow NULL for guest chat
    op.alter_column("conversation_messages", "user_id", nullable=True)


def downgrade() -> None:
    op.alter_column("conversation_messages", "user_id", nullable=False)
    op.alter_column("challenge_attempts", "user_id", nullable=False)
    op.alter_column("game_sessions", "user_id", nullable=False)
