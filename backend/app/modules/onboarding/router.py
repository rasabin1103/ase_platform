from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.onboarding.schemas import OnboardingCreateOrganizationRequest, OnboardingCreateOrganizationResponse
from app.modules.onboarding.service import OnboardingService

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


def get_service(db: Session = Depends(get_db)) -> OnboardingService:
    return OnboardingService(db)


@router.post(
    "/create-organization",
    response_model=OnboardingCreateOrganizationResponse,
    dependencies=[Depends(require_security_onboarding)],
)
def create_organization(
    payload: OnboardingCreateOrganizationRequest,
    user: User = Depends(get_current_active_user),
    svc: OnboardingService = Depends(get_service),
) -> OnboardingCreateOrganizationResponse:
    org, member = svc.create_organization(user=user, payload=payload)
    return OnboardingCreateOrganizationResponse(
        organization_uuid=org.uuid,
        organization_slug=org.slug,
        organization_name=org.name,
        member_id=member.id,
        created_at=org.created_at,
    )

