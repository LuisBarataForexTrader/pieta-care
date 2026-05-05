"""health: vitals, wellbeing, incidents, prn medication

Revision ID: a3f9c1e2d8b7
Revises: 89b3a79b6bc9
Create Date: 2026-05-05 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a3f9c1e2d8b7'
down_revision = '89b3a79b6bc9'
branch_labels = None
depends_on = None


def upgrade():
    # PRN flag on medications
    op.add_column('medications', sa.Column('is_prn', sa.Boolean(), nullable=False, server_default='false'))

    # Vital signs
    op.create_table(
        'vital_signs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('recorded_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('measured_at', sa.DateTime(), nullable=False),
        sa.Column('blood_pressure_sys', sa.Integer(), nullable=True),
        sa.Column('blood_pressure_dia', sa.Integer(), nullable=True),
        sa.Column('heart_rate', sa.Integer(), nullable=True),
        sa.Column('temperature', sa.Numeric(4, 1), nullable=True),
        sa.Column('weight', sa.Numeric(5, 2), nullable=True),
        sa.Column('oxygen_saturation', sa.Integer(), nullable=True),
        sa.Column('blood_glucose', sa.Numeric(5, 1), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Wellbeing logs
    op.create_table(
        'wellbeing_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('recorded_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('logged_date', sa.Date(), nullable=False),
        sa.Column('mood', sa.Integer(), nullable=False),
        sa.Column('energy', sa.Integer(), nullable=True),
        sa.Column('pain_level', sa.Integer(), nullable=True),
        sa.Column('appetite', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Incidents
    op.create_table(
        'incidents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('elderly_id', sa.Integer(), sa.ForeignKey('elderly_profiles.id'), nullable=False),
        sa.Column('reported_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('occurred_at', sa.DateTime(), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('actions_taken', sa.Text(), nullable=True),
        sa.Column('follow_up_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('incidents')
    op.drop_table('wellbeing_logs')
    op.drop_table('vital_signs')
    op.drop_column('medications', 'is_prn')
