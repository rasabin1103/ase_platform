from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.suggestion import Suggestion
from app.models.user import User


class SuggestionsRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, suggestion: Suggestion) -> Suggestion:
        self.db.add(suggestion)
        return suggestion

    def get(self, suggestion_id: int) -> Suggestion | None:
        return self.db.get(Suggestion, suggestion_id)

    def _joined_select(self):
        return (
            select(Suggestion, User.email, Organization.name)
            .join(User, User.id == Suggestion.user_id)
            .outerjoin(Organization, Organization.id == Suggestion.organization_id)
        )

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> tuple[list[tuple], int]:
        base = self._joined_select().where(Suggestion.user_id == user_id)
        total = int(
            self.db.execute(select(func.count()).select_from(select(Suggestion.id).where(Suggestion.user_id == user_id).subquery())).scalar_one()
        )
        stmt = base.order_by(Suggestion.created_at.desc()).limit(limit).offset(offset)
        return list(self.db.execute(stmt).all()), total

    def list_all(self, *, limit: int, offset: int, status: str | None = None) -> tuple[list[tuple], int]:
        base = self._joined_select()
        count_base = select(Suggestion.id)
        if status:
            base = base.where(Suggestion.status == status)
            count_base = count_base.where(Suggestion.status == status)
        total = int(self.db.execute(select(func.count()).select_from(count_base.subquery())).scalar_one())
        stmt = base.order_by(Suggestion.created_at.desc()).limit(limit).offset(offset)
        return list(self.db.execute(stmt).all()), total
