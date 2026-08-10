"""Allow user delete when referenced as platform role assigner."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "k6l7m8n9o0"
down_revision: Union[str, None] = "j5k6l7m8n9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "user_platform_roles_assigned_by_user_id_fkey",
        "user_platform_roles",
        type_="foreignkey",
    )
    op.alter_column(
        "user_platform_roles",
        "assigned_by_user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.create_foreign_key(
        "user_platform_roles_assigned_by_user_id_fkey",
        "user_platform_roles",
        "users",
        ["assigned_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "user_platform_roles_assigned_by_user_id_fkey",
        "user_platform_roles",
        type_="foreignkey",
    )
    op.execute(
        """
        UPDATE user_platform_roles
        SET assigned_by_user_id = user_id
        WHERE assigned_by_user_id IS NULL
        """
    )
    op.alter_column(
        "user_platform_roles",
        "assigned_by_user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.create_foreign_key(
        "user_platform_roles_assigned_by_user_id_fkey",
        "user_platform_roles",
        "users",
        ["assigned_by_user_id"],
        ["id"],
        ondelete="RESTRICT",
    )
