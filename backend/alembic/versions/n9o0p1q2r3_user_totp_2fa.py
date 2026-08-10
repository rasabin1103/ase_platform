"""User TOTP 2FA columns."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "n9o0p1q2r3"
down_revision: Union[str, None] = "m8n9o0p1q2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("two_factor_secret", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column("two_factor_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("two_factor_recovery_codes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "two_factor_recovery_codes")
    op.drop_column("users", "two_factor_confirmed_at")
    op.drop_column("users", "two_factor_secret")
