"""support_messages.deleted_at for soft-delete by admin

Revision ID: i5d0f6a2e4b8
Revises: h4c9e5f1d3a7
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'i5d0f6a2e4b8'
down_revision = 'h4c9e5f1d3a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('support_messages', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('support_messages', 'deleted_at')
