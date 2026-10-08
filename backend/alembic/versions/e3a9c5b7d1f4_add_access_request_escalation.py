"""add escalation fields to access_requests

Una organización puede escalar una solicitud de un miembro al equipo de la
plataforma (super_admin) cuando no puede o no debe resolverla ella misma.

Revision ID: e3a9c5b7d1f4
Revises: d7f2b4c8e6a1
Create Date: 2026-10-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "e3a9c5b7d1f4"
down_revision = "d7f2b4c8e6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("access_requests", sa.Column("escalated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "access_requests",
        sa.Column(
            "escalated_by_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("access_requests", sa.Column("escalation_note", sa.Text(), nullable=True))
    op.create_index("ix_access_requests_escalated_at", "access_requests", ["escalated_at"])


def downgrade() -> None:
    op.drop_index("ix_access_requests_escalated_at", table_name="access_requests")
    op.drop_column("access_requests", "escalation_note")
    op.drop_column("access_requests", "escalated_by_user_id")
    op.drop_column("access_requests", "escalated_at")
