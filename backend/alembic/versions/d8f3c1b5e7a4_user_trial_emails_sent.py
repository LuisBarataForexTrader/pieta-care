"""user trial_emails_sent JSON column

Revision ID: d8f3c1b5e7a4
Revises: c5e7a9b1d3f2
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'd8f3c1b5e7a4'
down_revision = 'c5e7a9b1d3f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('trial_emails_sent', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'trial_emails_sent')
