from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user
from app.modules.user_preferences.schemas import (
    PreferencesProfileRead,
    PreferencesProfileSubmitRequest,
)
from app.modules.user_preferences.service import UserPreferencesService

# Deliberately NOT under /onboarding — that prefix already means the
# unrelated organization-setup flow (see app/modules/onboarding/). This is
# the short, skippable "tell us about yourself" catalog-preferences survey.
router = APIRouter(prefix="/api/v1/preferences-profile", tags=["preferences-profile"])


def get_service(db: Session = Depends(get_db)) -> UserPreferencesService:
    return UserPreferencesService(db)


@router.get("/me", response_model=PreferencesProfileRead | None)
def get_my_preferences_profile(
    user: User = Depends(get_current_active_user),
    svc: UserPreferencesService = Depends(get_service),
):
    return svc.get_profile(user_id=user.id)


@router.put("/me", response_model=PreferencesProfileRead)
def submit_my_preferences_profile(
    payload: PreferencesProfileSubmitRequest,
    user: User = Depends(get_current_active_user),
    svc: UserPreferencesService = Depends(get_service),
):
    return svc.submit(user_id=user.id, payload=payload)


@router.post("/me/skip", response_model=PreferencesProfileRead)
def skip_my_preferences_profile(
    user: User = Depends(get_current_active_user),
    svc: UserPreferencesService = Depends(get_service),
):
    return svc.skip(user_id=user.id)
