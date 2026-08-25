"""add blog engagement (comments, reactions, shares, view counters)

Revision ID: 7a1b2c3d4e5f
Revises: 2c3d4e5f6a7b
Create Date: 2026-08-24
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "7a1b2c3d4e5f"
down_revision = "2c3d4e5f6a7b"
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


blog_reaction_type = postgresql.ENUM("like", "dislike", name="blog_reaction_type", create_type=False)
blog_share_network = postgresql.ENUM(
    "linkedin", "twitter", "facebook", "whatsapp", "instagram", "copy_link", "native",
    name="blog_share_network", create_type=False,
)


def upgrade() -> None:
    op.add_column("blog_posts", sa.Column("views_total", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("blog_posts", sa.Column("views_authenticated", sa.Integer(), nullable=False, server_default="0"))

    op.create_table(
        "blog_comments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("blog_post_id", sa.Integer(), sa.ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("blog_comments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_blog_comments_blog_post_id", "blog_comments", ["blog_post_id"])
    op.create_index("ix_blog_comments_user_id", "blog_comments", ["user_id"])
    op.create_index("ix_blog_comments_parent_id", "blog_comments", ["parent_id"])

    _ensure_enum("blog_reaction_type", ("like", "dislike"))
    op.create_table(
        "blog_post_reactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("blog_post_id", sa.Integer(), sa.ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reaction", blog_reaction_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("blog_post_id", "user_id", name="uq_blog_post_reactions_post_user"),
    )
    op.create_index("ix_blog_post_reactions_blog_post_id", "blog_post_reactions", ["blog_post_id"])
    op.create_index("ix_blog_post_reactions_user_id", "blog_post_reactions", ["user_id"])

    _ensure_enum("blog_share_network", ("linkedin", "twitter", "facebook", "whatsapp", "instagram", "copy_link", "native"))
    op.create_table(
        "blog_post_shares",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("blog_post_id", sa.Integer(), sa.ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("network", blog_share_network, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_blog_post_shares_blog_post_id", "blog_post_shares", ["blog_post_id"])


def downgrade() -> None:
    op.drop_index("ix_blog_post_shares_blog_post_id", table_name="blog_post_shares")
    op.drop_table("blog_post_shares")
    op.execute("DROP TYPE IF EXISTS blog_share_network")

    op.drop_index("ix_blog_post_reactions_user_id", table_name="blog_post_reactions")
    op.drop_index("ix_blog_post_reactions_blog_post_id", table_name="blog_post_reactions")
    op.drop_table("blog_post_reactions")
    op.execute("DROP TYPE IF EXISTS blog_reaction_type")

    op.drop_index("ix_blog_comments_parent_id", table_name="blog_comments")
    op.drop_index("ix_blog_comments_user_id", table_name="blog_comments")
    op.drop_index("ix_blog_comments_blog_post_id", table_name="blog_comments")
    op.drop_table("blog_comments")

    op.drop_column("blog_posts", "views_authenticated")
    op.drop_column("blog_posts", "views_total")
