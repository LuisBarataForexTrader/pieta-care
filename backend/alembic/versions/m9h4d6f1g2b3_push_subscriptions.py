"""push subscriptions table

Revision ID: m9h4d6f1g2b3
Revises: l8g3c5e9f0a2
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = 'm9h4d6f1g2b3'
down_revision = 'l8g3c5e9f0a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('endpoint', sa.Text, nullable=False, unique=True),
        sa.Column('p256dh', sa.Text, nullable=False),
        sa.Column('auth', sa.Text, nullable=False),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('last_used_at', sa.DateTime, nullable=True),
    )
    op.create_index('ix_push_subscriptions_user_id', 'push_subscriptions', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_push_subscriptions_user_id', table_name='push_subscriptions')
    op.drop_table('push_subscriptions')
