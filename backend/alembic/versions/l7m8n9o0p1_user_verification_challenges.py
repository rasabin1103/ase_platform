"""User verification challenges for email link and SMS codes."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "l7m8n9o0p1"
down_revision: Union[str, None] = "k6l7m8n9o0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    verification_channel = postgresql.ENUM("email", "sms", name="verification_channel", create_type=False)
    verification_channel.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "user_verification_challenges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("channel", verification_channel, nullable=False),
        sa.Column("destination", sa.String(length=320), nullable=False),
        sa.Column("secret_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_verification_challenges_user_id", "user_verification_challenges", ["user_id"])
    op.create_index("ix_user_verification_challenges_expires_at", "user_verification_challenges", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_user_verification_challenges_expires_at", table_name="user_verification_challenges")
    op.drop_index("ix_user_verification_challenges_user_id", table_name="user_verification_challenges")
    op.drop_table("user_verification_challenges")
    op.execute("DROP TYPE IF EXISTS verification_channel")
