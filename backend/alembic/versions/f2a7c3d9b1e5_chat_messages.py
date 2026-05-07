"""chat messages and read receipts

Revision ID: f2a7c3d9b1e5
Revises: e1f4b6c8d2a9
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'f2a7c3d9b1e5'
down_revision = 'e1f4b6c8d2a9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_chat_messages_elderly_created', 'chat_messages', ['elderly_id', 'created_at'])

    op.create_table(
        'chat_reads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('last_read_message_id', sa.Integer(), nullable=True),
        sa.Column('last_read_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('elderly_id', 'user_id', name='uq_chat_reads_elderly_user'),
    )


def downgrade() -> None:
    op.drop_table('chat_reads')
    op.drop_index('ix_chat_messages_elderly_created', table_name='chat_messages')
    op.drop_table('chat_messages')
