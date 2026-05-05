"""initial

Revision ID: 89b3a79b6bc9
Revises:
Create Date: 2026-05-05 18:14:33.798842

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '89b3a79b6bc9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=255), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_verified', sa.Boolean(), nullable=False),
    sa.Column('stripe_customer_id', sa.String(length=100), nullable=True),
    sa.Column('subscription_status', sa.String(length=20), nullable=False),
    sa.Column('trial_ends_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('elderly_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('full_name', sa.String(length=255), nullable=False),
    sa.Column('date_of_birth', sa.Date(), nullable=True),
    sa.Column('photo_url', sa.String(length=500), nullable=True),
    sa.Column('id_number', sa.String(length=50), nullable=True),
    sa.Column('health_number', sa.String(length=50), nullable=True),
    sa.Column('address', sa.Text(), nullable=True),
    sa.Column('medical_conditions', sa.Text(), nullable=True),
    sa.Column('allergies', sa.Text(), nullable=True),
    sa.Column('blood_type', sa.String(length=5), nullable=True),
    sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
    sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('calendar_events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('elderly_id', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('event_type', sa.String(length=50), nullable=False),
    sa.Column('starts_at', sa.DateTime(), nullable=False),
    sa.Column('ends_at', sa.DateTime(), nullable=True),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('doctor_name', sa.String(length=255), nullable=True),
    sa.Column('reminder_minutes', sa.Integer(), nullable=False),
    sa.Column('is_completed', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['elderly_id'], ['elderly_profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('elderly_id', sa.Integer(), nullable=False),
    sa.Column('uploaded_by', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('file_url', sa.String(length=500), nullable=False),
    sa.Column('file_size', sa.Integer(), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('document_date', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['elderly_id'], ['elderly_profiles.id'], ),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('family_members',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('elderly_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('invited_email', sa.String(length=255), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('relation', sa.String(length=100), nullable=True),
    sa.Column('is_accepted', sa.Boolean(), nullable=False),
    sa.Column('invite_token', sa.String(length=100), nullable=True),
    sa.Column('can_manage_medications', sa.Boolean(), nullable=False),
    sa.Column('can_manage_documents', sa.Boolean(), nullable=False),
    sa.Column('can_invite_others', sa.Boolean(), nullable=False),
    sa.Column('joined_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['elderly_id'], ['elderly_profiles.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('medications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('elderly_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('dosage', sa.String(length=100), nullable=False),
    sa.Column('instructions', sa.Text(), nullable=True),
    sa.Column('schedule_times', sa.Text(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['elderly_id'], ['elderly_profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('elderly_id', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('assigned_to', sa.Integer(), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('due_date', sa.DateTime(), nullable=True),
    sa.Column('is_completed', sa.Boolean(), nullable=False),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['elderly_id'], ['elderly_profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('medication_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('medication_id', sa.Integer(), nullable=False),
    sa.Column('confirmed_by', sa.Integer(), nullable=False),
    sa.Column('scheduled_time', sa.DateTime(), nullable=False),
    sa.Column('confirmed_at', sa.DateTime(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['confirmed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['medication_id'], ['medications.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('medication_logs')
    op.drop_table('tasks')
    op.drop_table('medications')
    op.drop_table('family_members')
    op.drop_table('documents')
    op.drop_table('calendar_events')
    op.drop_table('elderly_profiles')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
