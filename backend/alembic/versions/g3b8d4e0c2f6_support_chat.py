"""support chat threads + messages + users.is_admin

Revision ID: g3b8d4e0c2f6
Revises: f2a7c3d9b1e5
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'g3b8d4e0c2f6'
down_revision = 'f2a7c3d9b1e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    op.create_table(
        'support_threads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.Column('user_unread', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('admin_unread', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'support_messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('thread_id', sa.Integer(), sa.ForeignKey('support_threads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_admin_reply', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_support_messages_thread_created', 'support_messages', ['thread_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_support_messages_thread_created', table_name='support_messages')
    op.drop_table('support_messages')
    op.drop_table('support_threads')
    op.drop_column('users', 'is_admin')
