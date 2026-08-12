"""add error_logs table

Revision ID: 101abe7d6bf6
Revises: 9c2a7e5f1b3d
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "101abe7d6bf6"
down_revision = "9c2a7e5f1b3d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "error_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("method", sa.String(length=10), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("error_type", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("traceback", sa.Text(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_error_logs_occurred_at", "error_logs", ["occurred_at"])
    op.create_index("ix_error_logs_path", "error_logs", ["path"])
    op.create_index("ix_error_logs_error_type", "error_logs", ["error_type"])
    op.create_index("ix_error_logs_user_id", "error_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_error_logs_user_id", table_name="error_logs")
    op.drop_index("ix_error_logs_error_type", table_name="error_logs")
    op.drop_index("ix_error_logs_path", table_name="error_logs")
    op.drop_index("ix_error_logs_occurred_at", table_name="error_logs")
    op.drop_table("error_logs")
