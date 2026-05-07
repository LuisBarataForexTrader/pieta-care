"""backfill trial_ends_at to created_at + 14 days

Revision ID: e1f4b6c8d2a9
Revises: d8f3c1b5e7a4
Create Date: 2026-05-07
"""
from alembic import op

revision = 'e1f4b6c8d2a9'
down_revision = 'd8f3c1b5e7a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing trial users had trial_ends_at = created_at + 30 days. Move
    # them to the new 14-day window so the UI/emails align with the spec.
    op.execute("""
        UPDATE users
        SET trial_ends_at = created_at + INTERVAL '14 days'
        WHERE subscription_status = 'trial'
          AND trial_ends_at IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE users
        SET trial_ends_at = created_at + INTERVAL '30 days'
        WHERE subscription_status = 'trial'
          AND trial_ends_at IS NOT NULL
    """)
