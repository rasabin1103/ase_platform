from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class TestApprovedRef(Base, IdPkMixin, TimestampMixin):
    """An admin-granted allowlist entry: this buyer may dispatch this
    CatalogItem's test workflow against this specific git ref (branch/tag),
    in addition to the always-allowed default branch ("main").

    Exists because TestExecutionService.trigger_run accepts an optional
    `ref` on both the public (client_id/client_secret) and private
    (dashboard) trigger paths, and until this table existed that `ref` was
    passed straight through to github_client.dispatch_workflow with zero
    validation — any caller could already ask GitHub to run any branch in
    the repo. That's fine when the repo has one canonical branch everyone
    shares, but becomes a real problem once buyers are given push access to
    their own feature branches (see the "clone the framework, contribute
    improvements on a branch, get admin review before it's runnable"
    workflow this supports): a buyer's own unreviewed branch must never be
    dispatchable just because they know its name.

    `ref` is stored as the buyer typed/pushed it (a branch name, most
    commonly) — GitHub resolves it at dispatch time, this table doesn't
    need to know the difference between a branch, tag, or SHA.
    `label` is a short admin-facing note (e.g. "Roberto's pagination fix"),
    purely for the admin's own bookkeeping — never shown to other buyers."""

    __tablename__ = "test_approved_refs"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", "ref", name="uq_test_approved_refs_user_item_ref"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    ref: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return (
            f"<TestApprovedRef id={self.id} user_id={self.user_id} "
            f"catalog_item_id={self.catalog_item_id} ref={self.ref!r}>"
        )
