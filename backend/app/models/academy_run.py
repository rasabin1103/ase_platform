from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class AcademyRun(Base, IdPkMixin, TimestampMixin):
    """Saved progress of one ASE Academy simulator mission for one user.

    The simulator engine is deterministic (frontend/src/features/academy/
    engine), so the whole game state is reproducible from the seed plus the
    ordered list of player actions — that is all we store. One row per
    (user, course, mission): replaying a mission overwrites it."""

    __tablename__ = "academy_runs"
    __table_args__ = (
        UniqueConstraint("user_id", "course_key", "mission_id", name="uq_academy_runs_user_course_mission"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_key: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    mission_id: Mapped[str] = mapped_column(String(80), nullable=False)
    seed: Mapped[int] = mapped_column(Integer, nullable=False)
    actions_json: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    finished: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
