from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.admin_account_lifecycle.schemas import AccountLifecycleSummary, AccountLifecycleSweepResult
from app.modules.admin_account_lifecycle.service import AccountLifecycleAdminService
from app.modules.auth.dependencies import require_permission

router = APIRouter(prefix="/api/v1/admin/account-lifecycle", tags=["admin-account-lifecycle"])


def get_service(db: Session = Depends(get_db)) -> AccountLifecycleAdminService:
    return AccountLifecycleAdminService(db)


@router.get(
    "/summary", response_model=AccountLifecycleSummary, dependencies=[Depends(require_permission("platform.read"))],
)
def account_lifecycle_summary(svc: AccountLifecycleAdminService = Depends(get_service)):
    return svc.summary()


@router.post(
    "/run-sweep",
    response_model=AccountLifecycleSweepResult,
    dependencies=[Depends(require_permission("platform.manage"))],
)
def run_account_lifecycle_sweep(svc: AccountLifecycleAdminService = Depends(get_service)):
    """Manually triggers the same suspend/delete pass the daily scheduler
    runs — useful to verify the policy without waiting for the next
    scheduled run."""
    return svc.run_sweep_now()
