from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin


class AiAnalysisUsageEvent(Base, IdPkMixin):
    """One row per real AI job-fit analysis actually computed (a cache hit
    never logs one). Append-only and independent from the cached results in
    job_posting_semantic_analyses on purpose: those rows are deleted when the
    user replaces/removes their CV, and counting from them would let anyone
    refund their monthly quota just by re-uploading. See
    app.modules.plans.ai_quota."""

    __tablename__ = "ai_analysis_usage_events"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    job_posting_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("job_postings.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
