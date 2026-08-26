"""add consulting_slots — in-house QA-consulting session booking calendar

Block 3 of the "premium features" round: instead of embedding an external
scheduling tool (Calendly-style), booking is built directly on the platform
so it reuses the same auth, email, and admin-permission plumbing as
everything else, with no paid third-party dependency. An admin creates
`open` slots (usually in a batch); any authenticated user can claim one,
moving it to `booked`; cancelling a booking resets it back to `open` rather
than a separate `cancelled` state (that state is reserved for slots the
admin pulls entirely) — see ConsultingSlotStatus's docstring in
app/models/enums.py for the full rationale.

Revision ID: c1a8f3d29b6e
Revises: 9d4e7b2a5f1c
Create Date: 2026-08-26
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c1a8f3d29b6e"
down_revision: Union[str, None] = "9d4e7b2a5f1c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consulting_slots",
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column(
            "status",
            sa.Enum("open", "booked", "cancelled", name="consulting_slot_status"),
            nullable=False,
            server_default="open",
        ),
        sa.Column("created_by_admin_id", sa.Integer(), nullable=True),
        sa.Column("booked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("booked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(["created_by_admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["booked_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.alter_column("consulting_slots", "status", server_default=None)
    op.alter_column("consulting_slots", "duration_minutes", server_default=None)

    op.create_index(op.f("ix_consulting_slots_uuid"), "consulting_slots", ["uuid"], unique=True)
    op.create_index(op.f("ix_consulting_slots_starts_at"), "consulting_slots", ["starts_at"])
    op.create_index(op.f("ix_consulting_slots_status"), "consulting_slots", ["status"])
    op.create_index(op.f("ix_consulting_slots_booked_by_user_id"), "consulting_slots", ["booked_by_user_id"])


def downgrade() -> None:
    op.drop_table("consulting_slots")
    op.execute("DROP TYPE IF EXISTS consulting_slot_status")
