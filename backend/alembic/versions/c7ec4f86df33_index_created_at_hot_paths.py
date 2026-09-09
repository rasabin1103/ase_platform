"""index created_at on the hottest-queried timestamp columns

Revision ID: c7ec4f86df33
Revises: f3a9d6c1b872
Create Date: 2026-09-07

TimestampMixin's created_at has never carried index=True, so it's an
unindexed column on almost every table in the app. That's fine for tables
nothing ever filters/sorts by created_at, but a handful of tables are
queried by it constantly:

- catalog_purchases / subscriptions / users: the admin dashboard's growth
  and trend charts (app/modules/admin_dashboard/analytics.py) run several
  `WHERE created_at >= ...` / `GROUP BY date_trunc('month', created_at)`
  queries against these on every single dashboard load.
- catalog_items: every consumer catalog listing sorts newest-first on this
  column (ConsumerCatalogRepository.list).
- test_runs / book_repo_redemptions / access_requests: each has an
  admin-facing "newest first" list and/or a date-range filter.

Without an index, each of these is a full sequential scan that gets slower
as the table grows — cheap to fix now, expensive to notice later once a
table has real production volume. The corresponding model files were
updated in the same change to declare `index=True` on these columns
(matching the pattern already used by AuditLog.created_at), so this
migration just brings the actual schema in line with them.
"""

from __future__ import annotations

from alembic import op

revision = "c7ec4f86df33"
down_revision = "f3a9d6c1b872"
branch_labels = None
depends_on = None

_TABLES = (
    "catalog_purchases",
    "users",
    "subscriptions",
    "catalog_items",
    "test_runs",
    "access_requests",
    "book_repo_redemptions",
)


def upgrade() -> None:
    for table in _TABLES:
        op.create_index(op.f(f"ix_{table}_created_at"), table, ["created_at"], unique=False)


def downgrade() -> None:
    for table in _TABLES:
        op.drop_index(op.f(f"ix_{table}_created_at"), table_name=table)
