from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import TestRunConclusion, TestRunStatus
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class TestRun(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """One dispatch of a framework CatalogItem's GitHub Actions workflow,
    triggered through the public test-execution API by a customer's
    ApiCredential. Counted against that CatalogItem's test_included_runs
    quota for the credential's owning user the moment it's created
    (status=pending), before the GitHub Actions call is even confirmed —
    quota is "runs requested", not "runs that succeeded", so a customer
    can't get free retries by having their workflow intentionally fail.

    Status/conclusion mirror GitHub Actions' own run object exactly (see
    TestRunStatus/TestRunConclusion) and are kept in sync by a periodic
    APScheduler polling job (app.main) rather than a webhook — no public
    HTTPS endpoint on this backend is configured as a GitHub webhook target
    today, and polling every ~30-60s is simple and fast enough for
    test-suite runs that take minutes, not seconds."""

    __tablename__ = "test_runs"

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    # Null when triggered from the private dashboard ("Try it now" button,
    # JWT-authenticated) rather than the public client_id/client_secret API —
    # a dashboard trigger has no credential to attribute the run to, the
    # user's own session already identifies them (see user_id below).
    api_credential_id: Mapped[int | None] = mapped_column(
        ForeignKey("api_credentials.id", ondelete="CASCADE"), index=True, nullable=True,
    )
    # Denormalized off api_credential.user_id at creation time — quota
    # accounting and the private "my runs" screen both filter by this
    # directly, without joining through api_credentials, so history stays
    # intact and attributable even if the triggering credential is later
    # revoked (ondelete=CASCADE above only ever fires on account deletion,
    # not revocation, but this keeps the two concerns independent).
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    status: Mapped[TestRunStatus] = mapped_column(
        Enum(TestRunStatus, name="test_run_status", native_enum=True),
        nullable=False,
        default=TestRunStatus.pending,
        index=True,
    )
    conclusion: Mapped[TestRunConclusion | None] = mapped_column(
        Enum(TestRunConclusion, name="test_run_conclusion", native_enum=True), nullable=True,
    )
    # GitHub Actions' own numeric run id, filled in once the
    # workflow_dispatch call is confirmed and the run is located via the
    # "list runs" API (workflow_dispatch itself doesn't return an id).
    # BigInteger, not Integer — GitHub's run ids are well past 2^31 today
    # (e.g. 32863829932), which overflows a plain 32-bit INTEGER column and
    # made the polling job's UPDATE fail with "integer out of range" on
    # every single run, forever, silently swallowed by the sweep's
    # catch-all handler.
    github_run_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    github_run_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # Best-effort completion estimate — GitHub's run status has no
    # percentage, so the polling job approximates one from the run's own
    # job(s)/steps (completed steps / total steps), refreshed every sweep.
    # Null until the run has at least been picked up by a runner (steps
    # don't exist yet while purely "queued" with no assigned job).
    progress_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Free-text reason set when status flips to failed_to_dispatch (GitHub
    # API error, workflow file not found, etc.) — shown to the customer so
    # a dispatch failure isn't a silent quota loss with no explanation.
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Per-user "remove from my history" soft delete — the row (and its
    # counted-against-quota status) is never actually removed, since
    # TestExecutionService._used_runs counts by row existence regardless of
    # this field. Deleting for real would let a buyer reclaim quota by
    # hiding-then-recreating; this only ever affects what list_runs returns.
    hidden_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Which saved TestExecutionConfig ("scenario") this run's variables were
    # resolved from, if any — null when every required variable came from
    # an inline `variables` override (or the framework has no input schema
    # at all). ondelete=SET NULL rather than CASCADE: deleting a scenario
    # later should never take past run history down with it.
    test_execution_config_id: Mapped[int | None] = mapped_column(
        ForeignKey("test_execution_configs.id", ondelete="SET NULL"), index=True, nullable=True,
    )

    def __repr__(self) -> str:
        return f"<TestRun id={self.id} catalog_item_id={self.catalog_item_id} status={self.status.value}>"
