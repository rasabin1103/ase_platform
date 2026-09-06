"""add user_preferences_profiles

Optional, skippable post-registration survey (role, improvement goal,
solo/team, technologies, level) used to personalize catalog recommendations
(see app/models/user_preferences_profile.py — deliberately not named
anything with "onboarding", which already means the unrelated
organization-setup flow in this codebase).

Revision ID: d4c8a1f6e903
Revises: a3f7c92e1d68
Create Date: 2026-09-06
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4c8a1f6e903"
down_revision: Union[str, None] = "a3f7c92e1d68"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_preferences_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=40), nullable=True),
        sa.Column("improvement_goals", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("work_mode", sa.String(length=40), nullable=True),
        sa.Column("technologies", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("level", sa.String(length=20), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("skipped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_preferences_profiles_user_id"),
    )
    op.create_index(
        op.f("ix_user_preferences_profiles_user_id"), "user_preferences_profiles", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_preferences_profiles_user_id"), table_name="user_preferences_profiles")
    op.drop_table("user_preferences_profiles")
