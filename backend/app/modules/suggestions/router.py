from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import OrganizationType
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission, require_tenant_context
from app.modules.suggestions.schemas import (
    SuggestionCreate,
    SuggestionListResponse,
    SuggestionRead,
    SuggestionUpdate,
)
from app.modules.suggestions.service import SuggestionsService

router = APIRouter(prefix="/api/v1/suggestions", tags=["suggestions"])


def get_service(db: Session = Depends(get_db)) -> SuggestionsService:
    return SuggestionsService(db)


@router.post(
    "",
    response_model=SuggestionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("suggestions.create"))],
)
def create_suggestion(
    payload: SuggestionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: SuggestionsService = Depends(get_service),
):
    organization_id: int | None = None
    try:
        org = require_tenant_context(request, db, current_user)
        # Personal workspaces (individual-type orgs) aren't a real
        # "organization" the user can address a suggestion to — only
        # business/enterprise/academy orgs have owners/admins to notify.
        if org.type != OrganizationType.individual:
            organization_id = org.id
    except Exception:
        organization_id = None
    return svc.create(payload, user_id=current_user.id, organization_id=organization_id)


@router.get("/me", response_model=SuggestionListResponse)
def list_my_suggestions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    svc: SuggestionsService = Depends(get_service),
):
    return svc.list_for_user(user_id=current_user.id, limit=limit, offset=offset)


@router.get(
    "",
    response_model=SuggestionListResponse,
    dependencies=[Depends(require_permission("suggestions.manage"))],
)
def list_all_suggestions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: str | None = Query(default=None, alias="status"),
    svc: SuggestionsService = Depends(get_service),
):
    return svc.list_all(limit=limit, offset=offset, status_filter=status_filter)


@router.patch(
    "/{suggestion_id}",
    response_model=SuggestionRead,
    dependencies=[Depends(require_permission("suggestions.manage"))],
)
def update_suggestion(
    suggestion_id: int,
    payload: SuggestionUpdate,
    current_user: User = Depends(get_current_user),
    svc: SuggestionsService = Depends(get_service),
):
    return svc.update(suggestion_id, payload, reviewer_id=current_user.id)
