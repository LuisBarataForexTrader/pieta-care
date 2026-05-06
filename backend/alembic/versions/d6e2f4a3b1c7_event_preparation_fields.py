"""event_preparation_fields

Revision ID: d6e2f4a3b1c7
Revises: c5f1d3e8b2a4
Create Date: 2026-05-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'd6e2f4a3b1c7'
down_revision = 'c5f1d3e8b2a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('calendar_events', sa.Column('preparation_notes', sa.Text(), nullable=True))
    op.add_column('calendar_events', sa.Column('items_to_bring', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('calendar_events', 'items_to_bring')
    op.drop_column('calendar_events', 'preparation_notes')
