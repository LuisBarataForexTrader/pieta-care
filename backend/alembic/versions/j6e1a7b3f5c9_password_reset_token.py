"""user password reset token + expiry

Revision ID: j6e1a7b3f5c9
Revises: i5d0f6a2e4b8
Create Date: 2026-05-08
"""
from alembic import op
import sqlalchemy as sa

revision = 'j6e1a7b3f5c9'
down_revision = 'i5d0f6a2e4b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_reset_token', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(), nullable=True))
    op.create_index(
        'ix_users_password_reset_token',
        'users',
        ['password_reset_token'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_users_password_reset_token', table_name='users')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token')
