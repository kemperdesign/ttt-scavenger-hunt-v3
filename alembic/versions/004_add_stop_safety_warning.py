"""Add safety_warning column to stops (street-crossing / route-safety notes).

Revision ID: 004_add_stop_safety_warning
Revises: 003_add_ai_characters
Create Date: 2026-07-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004_add_stop_safety_warning'
down_revision = '003_add_ai_characters'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('stops', sa.Column('safety_warning', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('stops', 'safety_warning')
