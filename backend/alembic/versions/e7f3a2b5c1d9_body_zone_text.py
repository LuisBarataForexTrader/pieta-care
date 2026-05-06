"""body_zone text for multi-area json

Revision ID: e7f3a2b5c1d9
Revises: d6e2f4a3b1c7
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = 'e7f3a2b5c1d9'
down_revision = 'd6e2f4a3b1c7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('incidents') as batch_op:
        batch_op.alter_column('body_zone', type_=sa.Text(), existing_nullable=True)


def downgrade():
    with op.batch_alter_table('incidents') as batch_op:
        batch_op.alter_column('body_zone', type_=sa.String(50), existing_nullable=True)
