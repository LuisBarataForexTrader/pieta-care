"""user last_seen_at presence tracking

Revision ID: b1d3f5a7c9e2
Revises: a9b2c4d6e8f1
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'b1d3f5a7c9e2'
down_revision = 'a9b2c4d6e8f1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('last_seen_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_seen_at')
