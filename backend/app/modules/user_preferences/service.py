from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_preferences_profile import UserPreferencesProfile
from app.modules.user_preferences.schemas import (
    PreferencesProfileRead,
    PreferencesProfileSubmitRequest,
)


class UserPreferencesService:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_none(self, user_id: int) -> UserPreferencesProfile | None:
        return self.db.execute(
            select(UserPreferencesProfile).where(UserPreferencesProfile.user_id == user_id)
        ).scalar_one_or_none()

    def get_profile(self, *, user_id: int) -> PreferencesProfileRead | None:
        row = self._get_or_none(user_id)
        if row is None:
            return None
        return PreferencesProfileRead.model_validate(row)

    def submit(self, *, user_id: int, payload: PreferencesProfileSubmitRequest) -> PreferencesProfileRead:
        row = self._get_or_none(user_id)
        if row is None:
            row = UserPreferencesProfile(user_id=user_id)
            self.db.add(row)
        row.role = payload.role.value
        row.improvement_goals = [g.value for g in payload.improvement_goals]
        row.work_mode = payload.work_mode.value
        row.technologies = [t.value for t in payload.technologies]
        row.level = payload.level.value
        row.completed_at = datetime.now(timezone.utc)
        row.skipped_at = None
        self.db.commit()
        self.db.refresh(row)
        return PreferencesProfileRead.model_validate(row)

    def skip(self, *, user_id: int) -> PreferencesProfileRead:
        row = self._get_or_none(user_id)
        if row is None:
            row = UserPreferencesProfile(user_id=user_id)
            self.db.add(row)
        # Explicit skip only sets skipped_at — never clears previously saved
        # answers, in case someone answered before and skips a later re-ask.
        row.skipped_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(row)
        return PreferencesProfileRead.model_validate(row)

    @staticmethod
    def needs_survey(profile: UserPreferencesProfile | None) -> bool:
        """Used by AuthService when building MeResponse — True until the
        user has either submitted or explicitly skipped the survey once."""
        return profile is None or not profile.is_resolved
