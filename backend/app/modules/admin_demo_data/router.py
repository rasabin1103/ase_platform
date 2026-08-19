from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.admin_demo_data.schemas import SeedDemoUsersResponse
from app.modules.admin_demo_data.service import seed_demo_users
from app.modules.auth.dependencies import get_current_user, is_super_admin

router = APIRouter(prefix="/api/v1/admin/demo-data", tags=["admin-demo-data"])


def require_super_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if not is_super_admin(db, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el super admin puede acceder.")
    return user


@router.post("/seed-paid-users", response_model=SeedDemoUsersResponse)
def seed_paid_users(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    # Route path kept as-is (no frontend contract change) even though this
    # now also seeds a plan-less independent account — see seed_demo_users.
    return seed_demo_users(db)
