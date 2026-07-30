"""Add payment_status and square_payment_id to game_sessions.

Revision ID: 006_add_payment_status
Revises: 005_add_source_documents
Create Date: 2026-07-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '006_add_payment_status'
down_revision = '005_add_source_documents'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('game_sessions', sa.Column(
        'payment_status',
        sa.String(20),
        nullable=False,
        server_default='free',
    ))
    op.add_column('game_sessions', sa.Column(
        'square_payment_id',
        sa.String(200),
        nullable=True,
    ))
    op.create_index('ix_game_sessions_payment_status', 'game_sessions', ['payment_status'])


def downgrade() -> None:
    op.drop_index('ix_game_sessions_payment_status', table_name='game_sessions')
    op.drop_column('game_sessions', 'square_payment_id')
    op.drop_column('game_sessions', 'payment_status')
