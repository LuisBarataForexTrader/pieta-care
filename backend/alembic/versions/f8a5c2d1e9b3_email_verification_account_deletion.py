"""email verification and account deletion

Revision ID: f8a5c2d1e9b3
Revises: e7f3a2b5c1d9
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = 'f8a5c2d1e9b3'
down_revision = 'e7f3a2b5c1d9'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('email_verification_token', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime, nullable=True))

def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('email_verification_token')
        batch_op.drop_column('deleted_at')
