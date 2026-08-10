"""Add user_platform_roles for org-free independent users."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "i4j5k6l7m8"
down_revision = "h3i4j5k6l8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_platform_roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_platform_role_pair"),
    )
    op.create_index("ix_user_platform_roles_user_id", "user_platform_roles", ["user_id"])
    op.create_index("ix_user_platform_roles_role_id", "user_platform_roles", ["role_id"])
    op.create_index(
        "ix_user_platform_roles_assigned_by_user_id",
        "user_platform_roles",
        ["assigned_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_platform_roles_assigned_by_user_id", table_name="user_platform_roles")
    op.drop_index("ix_user_platform_roles_role_id", table_name="user_platform_roles")
    op.drop_index("ix_user_platform_roles_user_id", table_name="user_platform_roles")
    op.drop_table("user_platform_roles")
