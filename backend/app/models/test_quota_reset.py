from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class TestQuotaReset(Base, IdPkMixin, TimestampMixin):
    """An admin-granted "start counting again" marker for one
    (user, catalog_item) pair's test-run quota.

    TestExecutionService._used_runs counts every non-failed-dispatch TestRun
    row ever created for the pair, by design (see TestRun.hidden_at's
    docstring — a buyer "removing" a run from their own history must never
    reclaim quota, or hide-then-recreate becomes free retries). That
    design is correct for buyer self-service, but it also means there was no
    way for an admin to grant someone a fresh batch of runs (e.g. for a demo
    account, or as a courtesy) without either raising the CatalogItem's
    global test_included_runs (which affects every buyer) or hard-deleting
    that user's TestRun history (destroying real audit data and defeating
    the same free-retry protection for everyone whose rows got swept up in
    it).

    This row is the alternative: at most one per (user_id, catalog_item_id)
    (upserted, never inserted twice — see TestExecutionService.reset_quota),
    holding the timestamp of the most recent admin-granted reset.
    _used_runs only counts TestRun rows created at or after this timestamp
    once one exists, so history before the reset is preserved (still
    visible in "my runs") but no longer counts against the quota."""

    __tablename__ = "test_quota_resets"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", name="uq_test_quota_resets_user_item"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    reset_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return (
            f"<TestQuotaReset id={self.id} user_id={self.user_id} "
            f"catalog_item_id={self.catalog_item_id} reset_at={self.reset_at.isoformat()}>"
        )
