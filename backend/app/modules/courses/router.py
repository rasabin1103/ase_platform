from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CourseStatus
from app.models.user import User
from app.core.rbac import expand_permission_codes
from app.modules.auth.creator_guards import (
    assert_can_publish_course,
    require_create_course,
)
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.auth.dependencies import (
    get_current_user,
    is_platform_admin,
    is_super_admin,
    require_permission,
    require_tenant_context,
    user_has_any_permission,
)
from app.modules.courses.schemas import CourseCreate, CourseDashboardStats, CourseListResponse, CourseRead, CourseUpdate
from app.modules.courses.service import CoursesService

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


def get_service(db: Session = Depends(get_db)) -> CoursesService:
    return CoursesService(db)


@router.post(
    "",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_create_course()), Depends(require_security_onboarding)],
)
def create_course(
    payload: CourseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    if is_super_admin(db, current_user):
        return svc.create(payload)

    org = require_tenant_context(request, db, current_user)
    has_own = user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("courses.create_own"),
    )
    has_manage = user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("courses.manage"),
    )

    if has_own and not has_manage:
        payload = payload.model_copy(
            update={
                "organization_id": None,
                "organization_uuid": None,
                "owner_user_id": current_user.id,
                "owner_user_uuid": current_user.uuid,
                "status": CourseStatus.draft,
            }
        )
        return svc.create(payload)

    if not is_platform_admin(db, current_user):
        payload_org_id = svc.repo.get_organization_id(
            organization_id=payload.organization_id,
            organization_uuid=payload.organization_uuid,
        )
        if payload_org_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    return svc.create(payload)


@router.get("/stats/summary", response_model=CourseDashboardStats, dependencies=[Depends(require_permission("courses.read"))])
def courses_stats_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    organization_id = None if is_platform_admin(db, current_user) else require_tenant_context(request, db, current_user).id
    return svc.dashboard_stats(organization_id=organization_id)


@router.get("", response_model=CourseListResponse, dependencies=[Depends(require_permission("courses.read"))])
def list_courses(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_id: int | None = Query(default=None, ge=1),
    organization_uuid: UUID | None = None,
    owner_user_id: int | None = Query(default=None, ge=1),
    owner_user_uuid: UUID | None = None,
    status_filter: CourseStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    if is_platform_admin(db, current_user) and organization_uuid is not None:
        organization_id = svc.repo.get_organization_id(organization_id=None, organization_uuid=organization_uuid)
        if organization_id is None:
            return CourseListResponse(items=[], limit=limit, offset=offset, total=0)
    elif not is_platform_admin(db, current_user):
        organization_id = require_tenant_context(request, db, current_user).id
    if owner_user_uuid is not None:
        owner_user_id = svc.repo.get_owner_user_id(owner_user_id=None, owner_user_uuid=owner_user_uuid)
        if owner_user_id is None:
            return CourseListResponse(items=[], limit=limit, offset=offset, total=0)
    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        owner_user_id=owner_user_id,
        status_filter=status_filter,
        search=search,
    )
    return CourseListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{course_id}", response_model=CourseRead, dependencies=[Depends(require_permission("courses.read"))])
def get_course(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    course = svc.get(course_id)
    if not is_platform_admin(db, current_user) and course.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.patch("/{course_id}", response_model=CourseRead)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    course = svc.get(course_id)
    org = require_tenant_context(request, db, current_user)

    if course.owner_user_id is not None and course.owner_user_id == current_user.id:
        if not user_has_any_permission(
            db,
            user_id=current_user.id,
            organization_id=org.id,
            permission_codes=expand_permission_codes("courses.update_own"),
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
        assert_can_publish_course(db, current_user, target_status=payload.status)
    elif not is_platform_admin(db, current_user):
        if course.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        if not user_has_any_permission(
            db,
            user_id=current_user.id,
            organization_id=org.id,
            permission_codes=expand_permission_codes("courses.manage"),
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
        if "organization_id" in payload.model_fields_set or "organization_uuid" in payload.model_fields_set:
            payload_org_id = svc.repo.get_organization_id(
                organization_id=payload.organization_id,
                organization_uuid=payload.organization_uuid,
            )
            if payload_org_id != org.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    return svc.update(course_id, payload)


@router.delete("/{course_id}", response_model=CourseRead, dependencies=[Depends(require_permission("courses.manage")), Depends(require_security_onboarding)])
def delete_course(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CoursesService = Depends(get_service),
):
    course = svc.get(course_id)
    if not is_platform_admin(db, current_user) and course.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return svc.archive(course_id)


