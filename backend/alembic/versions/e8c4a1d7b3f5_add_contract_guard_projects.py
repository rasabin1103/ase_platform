"""add contract_guard_projects (propiedad de proyectos de Contract Guard)

Revision ID: e8c4a1d7b3f5
Revises: d1e7b3a9c4f2
Create Date: 2026-10-21
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "e8c4a1d7b3f5"
down_revision = "d1e7b3a9c4f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contract_guard_projects",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("project_uuid", name="uq_contract_guard_projects_project_uuid"),
    )
    op.create_index("ix_contract_guard_projects_user_id", "contract_guard_projects", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_contract_guard_projects_user_id", table_name="contract_guard_projects")
    op.drop_table("contract_guard_projects")
