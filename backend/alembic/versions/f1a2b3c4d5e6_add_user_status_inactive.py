"""Add inactive value to user_status enum."""

from __future__ import annotations

from alembic import op

revision = "f1a2b3c4d5e6"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'inactive'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values safely; no-op.
    pass
