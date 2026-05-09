"""user anti-trial-abuse signals

Revision ID: k7f2b8c4d6a1
Revises: j6e1a7b3f5c9
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = 'k7f2b8c4d6a1'
down_revision = 'j6e1a7b3f5c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone_normalized', sa.String(length=15), nullable=True))
    op.add_column('users', sa.Column('email_canonical', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('nif', sa.String(length=9), nullable=True))
    op.add_column('users', sa.Column('trial_used_at', sa.DateTime(), nullable=True))
    op.create_index('ix_users_phone_normalized', 'users', ['phone_normalized'])
    op.create_index('ix_users_email_canonical', 'users', ['email_canonical'])
    op.create_index('ix_users_nif', 'users', ['nif'])

    conn = op.get_bind()

    # Backfill email_canonical for existing rows (lowercase, strip
    # +suffix before @ for gmail-style aliases).
    conn.execute(sa.text("""
        UPDATE users
        SET email_canonical = LOWER(
          regexp_replace(
            split_part(email, '@', 1),
            '\\+.*$', ''
          ) || '@' || split_part(email, '@', 2)
        )
    """))

    # Mark every user that has at any point had access to a paid/trial
    # subscription as having "used" their trial. Members (invited
    # household users) and already-expired accounts are NOT marked —
    # they never had their own trial.
    conn.execute(sa.text("""
        UPDATE users
        SET trial_used_at = COALESCE(created_at, NOW())
        WHERE subscription_status IN ('trial', 'trialing', 'active', 'past_due', 'canceled')
          AND trial_used_at IS NULL
    """))

    # Backfill phone_normalized from existing phone column (digits only,
    # last 9 chars). Only when there are at least 9 digits to keep.
    conn.execute(sa.text("""
        UPDATE users
        SET phone_normalized = RIGHT(regexp_replace(phone, '\\D', '', 'g'), 9)
        WHERE phone IS NOT NULL
          AND length(regexp_replace(phone, '\\D', '', 'g')) >= 9
    """))


def downgrade() -> None:
    op.drop_index('ix_users_nif', table_name='users')
    op.drop_index('ix_users_email_canonical', table_name='users')
    op.drop_index('ix_users_phone_normalized', table_name='users')
    op.drop_column('users', 'trial_used_at')
    op.drop_column('users', 'nif')
    op.drop_column('users', 'email_canonical')
    op.drop_column('users', 'phone_normalized')
