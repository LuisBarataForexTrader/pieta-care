"""clinical_diagnoses and vaccinations tables

Revision ID: c5f1d3e8b2a4
Revises: b4e3f2a1c9d8
Create Date: 2026-05-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c5f1d3e8b2a4'
down_revision = 'b4e3f2a1c9d8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'clinical_diagnoses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('description', sa.String(300), nullable=False),
        sa.Column('icd_code', sa.String(20), nullable=True),
        sa.Column('diagnosed_date', sa.Date(), nullable=True),
        sa.Column('is_chronic', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('source', sa.String(50), nullable=True),   # sns, manual, medico
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'vaccinations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('vaccine_name', sa.String(200), nullable=False),
        sa.Column('administered_date', sa.Date(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=True),
        sa.Column('lot_number', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(50), nullable=True),   # sns, manual
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('vaccinations')
    op.drop_table('clinical_diagnoses')
