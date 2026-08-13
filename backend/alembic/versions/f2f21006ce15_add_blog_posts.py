"""add blog_posts

Revision ID: f2f21006ce15
Revises: 0c5207f86e10
Create Date: 2026-08-13
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f2f21006ce15"
down_revision = "0c5207f86e10"
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


blog_post_status = postgresql.ENUM("draft", "published", name="blog_post_status", create_type=False)


def upgrade() -> None:
    _ensure_enum("blog_post_status", ("draft", "published"))
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False, unique=True),
        sa.Column("excerpt", sa.String(length=500), nullable=False),
        sa.Column("content_html", sa.Text(), nullable=False),
        sa.Column("cover_image_url", sa.String(length=2048), nullable=True),
        sa.Column("cover_image_data", sa.LargeBinary(), nullable=True),
        sa.Column("cover_image_mime", sa.String(length=64), nullable=True),
        sa.Column("author_name", sa.String(length=150), nullable=True),
        sa.Column("tags_json", postgresql.JSONB(), nullable=True),
        sa.Column(
            "status",
            blog_post_status,
            nullable=False,
            server_default="draft",
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("meta_title", sa.String(length=160), nullable=True),
        sa.Column("meta_description", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_blog_posts_uuid", "blog_posts", ["uuid"])
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])


def downgrade() -> None:
    op.drop_index("ix_blog_posts_status", table_name="blog_posts")
    op.drop_index("ix_blog_posts_slug", table_name="blog_posts")
    op.drop_index("ix_blog_posts_uuid", table_name="blog_posts")
    op.drop_table("blog_posts")
    op.execute("DROP TYPE IF EXISTS blog_post_status")
