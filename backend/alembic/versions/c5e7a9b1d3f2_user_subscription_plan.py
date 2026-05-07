"""user subscription_plan column

Revision ID: c5e7a9b1d3f2
Revises: b1d3f5a7c9e2
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'c5e7a9b1d3f2'
down_revision = 'b1d3f5a7c9e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('subscription_plan', sa.String(length=30), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'subscription_plan')
