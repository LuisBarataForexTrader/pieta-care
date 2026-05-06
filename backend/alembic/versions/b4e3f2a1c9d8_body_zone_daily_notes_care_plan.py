"""body_zone on incidents, daily_notes, care_plan_items

Revision ID: b4e3f2a1c9d8
Revises: a3f9c1e2d8b7
Create Date: 2026-05-06 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b4e3f2a1c9d8'
down_revision = 'a3f9c1e2d8b7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('incidents', sa.Column('body_zone', sa.String(50), nullable=True))

    op.create_table(
        'daily_notes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('recorded_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('note_date', sa.Date(), nullable=False),
        sa.Column('shift', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('mood_observed', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'care_plan_items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('care_plan_items')
    op.drop_table('daily_notes')
    op.drop_column('incidents', 'body_zone')
