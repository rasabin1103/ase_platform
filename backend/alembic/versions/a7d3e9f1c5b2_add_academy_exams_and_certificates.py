"""add academy mock exams and certificates

Revision ID: a7d3e9f1c5b2
Revises: f6b2d9a4c8e1
Create Date: 2026-10-12
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a7d3e9f1c5b2"
down_revision = "f6b2d9a4c8e1"
branch_labels = None
depends_on = None


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    ]


def upgrade() -> None:
    op.create_table(
        "academy_exam_attempts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_key", sa.String(80), nullable=False),
        sa.Column("bank_version", sa.String(40), nullable=False),
        sa.Column("extended_time", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("timed_out", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("questions_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("answers_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("total", sa.Integer(), nullable=False),
        sa.Column("pass_mark", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("passed", sa.Boolean(), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_academy_exam_attempts_uuid", "academy_exam_attempts", ["uuid"], unique=True)
    op.create_index("ix_academy_exam_attempts_user_id", "academy_exam_attempts", ["user_id"])
    op.create_index("ix_academy_exam_attempts_course_key", "academy_exam_attempts", ["course_key"])

    op.create_table(
        "academy_certificates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_key", sa.String(80), nullable=False),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("holder_name", sa.String(200), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False),
        sa.Column(
            "attempt_id",
            sa.Integer(),
            sa.ForeignKey("academy_exam_attempts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        *_timestamps(),
        sa.UniqueConstraint("user_id", "course_key", name="uq_academy_certificates_user_course"),
    )
    op.create_index("ix_academy_certificates_user_id", "academy_certificates", ["user_id"])
    op.create_index("ix_academy_certificates_code", "academy_certificates", ["code"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_academy_certificates_code", table_name="academy_certificates")
    op.drop_index("ix_academy_certificates_user_id", table_name="academy_certificates")
    op.drop_table("academy_certificates")
    op.drop_index("ix_academy_exam_attempts_course_key", table_name="academy_exam_attempts")
    op.drop_index("ix_academy_exam_attempts_user_id", table_name="academy_exam_attempts")
    op.drop_index("ix_academy_exam_attempts_uuid", table_name="academy_exam_attempts")
    op.drop_table("academy_exam_attempts")
