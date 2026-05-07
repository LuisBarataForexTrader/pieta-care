"""seed initial admin user (luisbarata@proton.me)

Revision ID: h4c9e5f1d3a7
Revises: g3b8d4e0c2f6
Create Date: 2026-05-07
"""
from alembic import op

revision = 'h4c9e5f1d3a7'
down_revision = 'g3b8d4e0c2f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE users
        SET is_admin = true
        WHERE email IN ('luisbarata@proton.me', 'luis@flow88.pt')
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE users
        SET is_admin = false
        WHERE email IN ('luisbarata@proton.me', 'luis@flow88.pt')
    """)
