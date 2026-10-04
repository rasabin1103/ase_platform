"""add job_postings

Revision ID: b3f7a2c9d1e6
Revises: c7ec4f86df33
Create Date: 2026-10-02

Admin-managed job-offer listings, browsable/filterable by any authenticated
user (independent or organization) — see app/models/job_posting.py. Same
in-row binary image storage as blog_posts, same simple view-counter
pattern, plus a clicks_total counter for the external application link.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b3f7a2c9d1e6"
down_revision = "c7ec4f86df33"
branch_labels = None
depends_on = None


def _ensure_enum(name: str, values: tuple[str, ...]) -> None:
    labels = ", ".join(f"'{v}'" for v in values)
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({labels});
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )


job_posting_status = postgresql.ENUM("draft", "published", name="job_posting_status", create_type=False)
job_contract_type = postgresql.ENUM(
    "permanent", "temporary", "freelance", "internship", name="job_contract_type", create_type=False,
)
job_work_mode = postgresql.ENUM("remote", "hybrid", "onsite", name="job_work_mode", create_type=False)
job_schedule_type = postgresql.ENUM("full_time", "part_time", name="job_schedule_type", create_type=False)
job_salary_type = postgresql.ENUM("gross_yearly", "hourly", name="job_salary_type", create_type=False)


def upgrade() -> None:
    _ensure_enum("job_posting_status", ("draft", "published"))
    _ensure_enum("job_contract_type", ("permanent", "temporary", "freelance", "internship"))
    _ensure_enum("job_work_mode", ("remote", "hybrid", "onsite"))
    _ensure_enum("job_schedule_type", ("full_time", "part_time"))
    _ensure_enum("job_salary_type", ("gross_yearly", "hourly"))

    op.create_table(
        "job_postings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_data", sa.LargeBinary(), nullable=True),
        sa.Column("image_mime", sa.String(length=64), nullable=True),
        sa.Column("link_url", sa.String(length=2048), nullable=False),
        sa.Column("salary_type", job_salary_type, nullable=False),
        sa.Column("salary_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("salary_amount_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("contract_type", job_contract_type, nullable=False),
        sa.Column("work_mode", job_work_mode, nullable=False),
        sa.Column("schedule_type", job_schedule_type, nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("status", job_posting_status, nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("views_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_job_postings_uuid", "job_postings", ["uuid"])
    op.create_index("ix_job_postings_status", "job_postings", ["status"])
    op.create_index("ix_job_postings_contract_type", "job_postings", ["contract_type"])
    op.create_index("ix_job_postings_work_mode", "job_postings", ["work_mode"])
    op.create_index("ix_job_postings_schedule_type", "job_postings", ["schedule_type"])
    op.create_index("ix_job_postings_category", "job_postings", ["category"])


def downgrade() -> None:
    op.drop_index("ix_job_postings_category", table_name="job_postings")
    op.drop_index("ix_job_postings_schedule_type", table_name="job_postings")
    op.drop_index("ix_job_postings_work_mode", table_name="job_postings")
    op.drop_index("ix_job_postings_contract_type", table_name="job_postings")
    op.drop_index("ix_job_postings_status", table_name="job_postings")
    op.drop_index("ix_job_postings_uuid", table_name="job_postings")
    op.drop_table("job_postings")
    op.execute("DROP TYPE IF EXISTS job_salary_type")
    op.execute("DROP TYPE IF EXISTS job_schedule_type")
    op.execute("DROP TYPE IF EXISTS job_work_mode")
    op.execute("DROP TYPE IF EXISTS job_contract_type")
    op.execute("DROP TYPE IF EXISTS job_posting_status")
