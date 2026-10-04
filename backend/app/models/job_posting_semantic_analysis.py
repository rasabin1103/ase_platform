from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class JobPostingSemanticAnalysis(Base, IdPkMixin, TimestampMixin):
    """Caches the AI ("Análisis semántico") result for one (user, posting)
    pair — computed at most once per pair. The whole point is to never call
    Groq twice for the same CV/posting combination: once a user analyzes a
    posting, the result (and the percentage shown everywhere for that
    posting) is this row, not a fresh API call. Invalidated (deleted) when
    the user uploads a new CV or removes it, since the analysis was scored
    against a CV that no longer applies — see
    JobPostingConsumerService.upload_cv / delete_cv."""

    __tablename__ = "job_posting_semantic_analyses"
    __table_args__ = (
        UniqueConstraint("user_id", "job_posting_id", name="uq_job_posting_semantic_analyses_user_posting"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    job_posting_id: Mapped[int] = mapped_column(
        ForeignKey("job_postings.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    gaps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    # Auto-translated to English via DeepL right after the Groq call that
    # fills the fields above (Groq itself replies in the posting's
    # language — see app/core/semantic_match.py's system prompt). Nullable
    # because translation can fail; the read side falls back to the
    # Spanish fields when so (same pattern as JobPosting.title_en).
    # 5 tailored interview-prep suggestions (+ English mirror). Nullable:
    # rows saved before this feature existed have none.
    interview_tips: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    interview_tips_en: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    summary_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    strengths_en: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    gaps_en: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<JobPostingSemanticAnalysis user_id={self.user_id} "
            f"job_posting_id={self.job_posting_id} percentage={self.percentage}>"
        )
