from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

# NOTE: deliberately NOT named anything with "onboarding" — that word is
# already taken by the unrelated organization-setup flow (see
# app/modules/onboarding/ and frontend's OnboardingPage.tsx / `/onboarding`
# route, both about creating/joining an organization). This is a separate,
# optional "tell us about yourself" survey shown to independent/consumer
# users after registering, used to personalize catalog recommendations.


class UserPreferencesProfile(Base, IdPkMixin, TimestampMixin):
    """One-per-user, optional profile captured via a short post-registration
    survey (role, goal, solo/team, technologies, level). Skippable — a row
    with ``skipped_at`` set (and every answer null) means the user chose not
    to answer, so the gate never asks again; a row with ``completed_at`` set
    means real answers were saved. Absence of any row at all means the user
    has never been asked yet (new/pre-existing account).

    Answers are picked from small fixed vocabularies (see
    app.modules.user_preferences.schemas) rather than free text, precisely so
    ConsumerCatalogService's recommendation scoring can match them against
    CatalogItem.level / tags_json / category without any NLP/fuzzy matching.
    """

    __tablename__ = "user_preferences_profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Fixed-vocabulary single choice — see PreferenceRole in schemas.py.
    role: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Fixed-vocabulary multi-select — e.g. ["automation", "process"].
    improvement_goals: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    # Fixed-vocabulary single choice — "individual" | "small_team" | "large_team".
    work_mode: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Fixed-vocabulary multi-select — e.g. ["selenium", "cypress", "python"].
    technologies: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    # Matches CatalogItemLevel.value exactly ("beginner"/"intermediate"/
    # "advanced") on purpose, so the recommendation scorer can compare
    # `profile.level == item.level.value` with no translation layer.
    level: Mapped[str | None] = mapped_column(String(20), nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    skipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<UserPreferencesProfile id={self.id} user_id={self.user_id}>"

    @property
    def is_resolved(self) -> bool:
        """True once the user has either answered or explicitly skipped —
        the signal the post-login gate uses to stop asking again."""
        return self.completed_at is not None or self.skipped_at is not None
