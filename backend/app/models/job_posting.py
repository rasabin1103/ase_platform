from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, Integer, LargeBinary, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import JobContractType, JobPostingStatus, JobScheduleType, JobSalaryType, JobWorkMode
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class JobPosting(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A job offer posted by the super admin, browsable/filterable by any
    logged-in user (independent or organization). Same cover-image storage
    pattern as BlogPost (binary in-row, no bucket) and the same simple
    view-counter pattern — see app/models/blog_post.py. `clicks_total`
    mirrors that for the one extra signal this needs: how many times
    someone actually followed the external application link."""

    __tablename__ = "job_postings"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Auto-translated to English via DeepL on save, same pattern as
    # CatalogItem.title_en/CatalogAdminService._ensure_english_fields (see
    # app/core/translation.py and JobPostingAdminService._ensure_english_fields).
    # Admin can also set these explicitly to override the auto-translation.
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    image_mime: Mapped[str | None] = mapped_column(String(64), nullable=True)
    link_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    salary_type: Mapped[JobSalaryType] = mapped_column(
        Enum(JobSalaryType, name="job_salary_type", native_enum=True), nullable=False,
    )
    salary_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Optional upper bound for a range (e.g. "35.000-40.000€ brutos/año");
    # null means a single fixed figure in salary_amount.
    salary_amount_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    contract_type: Mapped[JobContractType] = mapped_column(
        Enum(JobContractType, name="job_contract_type", native_enum=True), nullable=False, index=True,
    )
    work_mode: Mapped[JobWorkMode] = mapped_column(
        Enum(JobWorkMode, name="job_work_mode", native_enum=True), nullable=False, index=True,
    )
    schedule_type: Mapped[JobScheduleType] = mapped_column(
        Enum(JobScheduleType, name="job_schedule_type", native_enum=True), nullable=False, index=True,
    )
    # Free-text category/area ("Desarrollo", "QA", "Diseño"...) rather than a
    # fixed enum — the admin defines the taxonomy as postings get created,
    # same tradeoff as BlogPost.tags_json; the consumer filter UI sources its
    # option list from the distinct values already in use (see
    # JobPostingService.list_categories), not from a hardcoded list.
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    status: Mapped[JobPostingStatus] = mapped_column(
        Enum(JobPostingStatus, name="job_posting_status", native_enum=True),
        nullable=False,
        default=JobPostingStatus.draft,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Simple counters, not deduped per visitor — same rationale as
    # BlogPost.views_total: good enough for "how is this posting doing",
    # not an analytics-grade unique-visitor count.
    views_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    clicks_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    def __repr__(self) -> str:
        return f"<JobPosting id={self.id} title={self.title!r} status={self.status.value}>"
