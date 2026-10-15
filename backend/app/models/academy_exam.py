from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class AcademyExamAttempt(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """One attempt at an ASE Academy mock exam (simulacro).

    The question bank lives in code (app/modules/academy/exam_bank); an
    attempt stores which questions were drawn, the option permutation shown
    to the player and their answers. Grading happens server-side, so the
    correct answers never reach the browser before submission."""

    __tablename__ = "academy_exam_attempts"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_key: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    bank_version: Mapped[str] = mapped_column(String(40), nullable=False)
    extended_time: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # True when the server closed the attempt because time ran out.
    timed_out: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # [{"id": "c4-08", "order": [2, 0, 3, 1]}, ...] — order[i] = bank index shown at position i.
    questions_json: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    # {"c4-08": 1, ...} — displayed option index chosen by the player.
    answers_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    pass_mark: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class AcademyCertificate(Base, IdPkMixin, TimestampMixin):
    """ASE completion certificate (not an official ISTQB certificate): passed
    mock exam + every mission of the course finished. Publicly verifiable by
    its code. One per user and course."""

    __tablename__ = "academy_certificates"
    __table_args__ = (UniqueConstraint("user_id", "course_key", name="uq_academy_certificates_user_course"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_key: Mapped[str] = mapped_column(String(80), nullable=False)
    code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    holder_name: Mapped[str] = mapped_column(String(200), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    attempt_id: Mapped[int | None] = mapped_column(
        ForeignKey("academy_exam_attempts.id", ondelete="SET NULL"), nullable=True
    )
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
