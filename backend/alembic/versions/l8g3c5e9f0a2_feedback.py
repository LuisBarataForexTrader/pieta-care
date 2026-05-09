"""feedback table

Revision ID: l8g3c5e9f0a2
Revises: k7f2b8c4d6a1
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = 'l8g3c5e9f0a2'
down_revision = 'k7f2b8c4d6a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Integer, nullable=False),
        sa.Column('comment', sa.Text, nullable=True),
        sa.Column('source', sa.String(40), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_feedback_user_id', 'feedback', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_feedback_user_id', table_name='feedback')
    op.drop_table('feedback')
