"""add user_verification_tokens (password reset + email verification)

Revision ID: 4e1f6c3a9b7d
Revises: 7b4c8f21d3a9
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "4e1f6c3a9b7d"
down_revision = "7b4c8f21d3a9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_verification_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "purpose",
            sa.Enum("password_reset", "email_verification", name="user_token_purpose"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_verification_tokens_user_id", "user_verification_tokens", ["user_id"])
    op.create_index("ix_user_verification_tokens_purpose", "user_verification_tokens", ["purpose"])
    op.create_index(
        "ix_user_verification_tokens_token_hash", "user_verification_tokens", ["token_hash"], unique=True
    )

    # Purchases now require a verified email going forward. Every account
    # that already existed before this migration was created without ever
    # going through a verification step, so treat them as already verified
    # (backfilled to their signup date) rather than retroactively locking
    # existing users out of buying anything.
    op.execute("UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL")


def downgrade() -> None:
    op.drop_index("ix_user_verification_tokens_token_hash", table_name="user_verification_tokens")
    op.drop_index("ix_user_verification_tokens_purpose", table_name="user_verification_tokens")
    op.drop_index("ix_user_verification_tokens_user_id", table_name="user_verification_tokens")
    op.drop_table("user_verification_tokens")
    op.execute("DROP TYPE IF EXISTS user_token_purpose")
