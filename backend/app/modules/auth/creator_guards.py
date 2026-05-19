from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.creator import CREATOR_APPROVAL_REQUIRED_MSG
from app.core.database import get_db
from app.models.enums import CourseStatus, ProductStatus
from app.models.user import User
from app.modules.auth.dependencies import (
    _resolve_effective_org_id,
    get_current_user,
    is_super_admin,
    user_has_any_permission,
)

# Permissions that allow creating platform catalog products (super admin path).
_PRODUCTS_MANAGE = frozenset({"products.manage", "platform.manage"})
_COURSES_MANAGE_ORG = frozenset({"courses.manage"})
_PRODUCTS_CREATE_OWN = frozenset({"products.create_own"})
_COURSES_CREATE_OWN = frozenset({"courses.create_own"})


def _org_id_or_400(request: Request, db: Session, user: User) -> int:
    org_id = _resolve_effective_org_id(request, db, user)
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No workspace is associated with this user.",
        )
    return org_id


def assert_can_create_product(
    db: Session,
    user: User,
    request: Request,
) -> None:
    if is_super_admin(db, user):
        return
    org_id = _org_id_or_400(request, db, user)
    if user_has_any_permission(
        db, user_id=user.id, organization_id=org_id, permission_codes=_PRODUCTS_MANAGE
    ):
        return
    if user_has_any_permission(
        db, user_id=user.id, organization_id=org_id, permission_codes=_PRODUCTS_CREATE_OWN
    ):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=CREATOR_APPROVAL_REQUIRED_MSG)


def assert_can_create_course(
    db: Session,
    user: User,
    request: Request,
) -> None:
    if is_super_admin(db, user):
        return
    org_id = _org_id_or_400(request, db, user)
    if user_has_any_permission(
        db, user_id=user.id, organization_id=org_id, permission_codes=_COURSES_MANAGE_ORG
    ):
        return
    if user_has_any_permission(
        db, user_id=user.id, organization_id=org_id, permission_codes=_COURSES_CREATE_OWN
    ):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=CREATOR_APPROVAL_REQUIRED_MSG)


def assert_can_publish_course(
    db: Session,
    user: User,
    *,
    target_status: CourseStatus | None,
) -> None:
    if target_status is None or target_status != CourseStatus.published:
        return
    if is_super_admin(db, user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Published courses require super admin review. Save as draft or submit for review.",
    )


def assert_can_activate_product(
    db: Session,
    user: User,
    *,
    target_status: ProductStatus | None,
    owner_user_id: int | None,
    current_user_id: int,
) -> None:
    if target_status is None or target_status == ProductStatus.active:
        if owner_user_id is not None and owner_user_id == current_user_id and not is_super_admin(db, user):
            if target_status == ProductStatus.active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Creator products require super admin approval before activation.",
                )
        return
    if is_super_admin(db, user):
        return


def require_create_product():
    def _dep(
        request: Request,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> None:
        assert_can_create_product(db, user, request)

    return _dep


def require_create_course():
    def _dep(
        request: Request,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> None:
        assert_can_create_course(db, user, request)

    return _dep
