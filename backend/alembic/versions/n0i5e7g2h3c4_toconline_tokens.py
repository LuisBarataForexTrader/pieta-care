"""toconline_tokens table

Revision ID: n0i5e7g2h3c4
Revises: m9h4d6f1g2b3
Create Date: 2026-05-09

Stores the single OAuth refresh + access token pair for the
TOConline authorization_code flow. Single row by design (id=1) —
the integration runs against one TOConline account.
"""
from alembic import op
import sqlalchemy as sa

revision = 'n0i5e7g2h3c4'
down_revision = 'm9h4d6f1g2b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'toconline_tokens',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('access_token', sa.Text, nullable=True),
        sa.Column('refresh_token', sa.Text, nullable=True),
        # Both tokens carry exact UTC expiry timestamps. Refresh tokens
        # in TOConline don't expire on a fixed schedule, but we record
        # last refresh for diagnostics.
        sa.Column('access_expires_at', sa.DateTime, nullable=True),
        sa.Column('refresh_expires_at', sa.DateTime, nullable=True),
        sa.Column('last_refresh_at', sa.DateTime, nullable=True),
        sa.Column('last_refresh_error', sa.Text, nullable=True),
        # Anti-spam: don't email the admin more than once per cooldown.
        sa.Column('auth_alert_sent_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('toconline_tokens')
