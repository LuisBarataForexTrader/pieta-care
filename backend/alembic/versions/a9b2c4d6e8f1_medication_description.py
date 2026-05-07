"""medication description and fetched_at

Revision ID: a9b2c4d6e8f1
Revises: f8a5c2d1e9b3
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'a9b2c4d6e8f1'
down_revision = 'f8a5c2d1e9b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('medications', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('medications', sa.Column('description_fetched_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('medications', 'description_fetched_at')
    op.drop_column('medications', 'description')
