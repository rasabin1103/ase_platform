from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import EnrollmentStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.course_enrollments.schemas import (
    CourseEnrollmentCreate,
    CourseEnrollmentListResponse,
    CourseEnrollmentRead,
    CourseEnrollmentUpdate,
)
from app.modules.course_enrollments.service import CourseEnrollmentsService

router = APIRouter(prefix="/api/v1/course-enrollments", tags=["course-enrollments"])


def get_service(db: Session = Depends(get_db)) -> CourseEnrollmentsService:
    return CourseEnrollmentsService(db)


@router.post(
    "",
    response_model=CourseEnrollmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("courses.manage"))],
)
def create_enrollment(
    payload: CourseEnrollmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CourseEnrollmentsService = Depends(get_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        if svc.repo.get_course_organization_id(payload.course_id) != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course mismatch")
    return svc.create(payload)


@router.get("", response_model=CourseEnrollmentListResponse, dependencies=[Depends(require_permission("courses.read"))])
def list_enrollments(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    course_id: int | None = Query(default=None, ge=1),
    user_id: int | None = Query(default=None, ge=1),
    user_uuid: UUID | None = None,
    status_filter: EnrollmentStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CourseEnrollmentsService = Depends(get_service),
):
    if user_uuid is not None:
        user_id = svc.repo.get_user_id(user_id=None, user_uuid=user_uuid)
        if user_id is None:
            return CourseEnrollmentListResponse(items=[], limit=limit, offset=offset, total=0)
    organization_id = None if is_platform_admin(db, current_user) else require_tenant_context(request, db, current_user).id
    items, total = svc.list(
        limit=limit,
        offset=offset,
        course_id=course_id,
        user_id=user_id,
        status_filter=status_filter,
        organization_id=organization_id,
    )
    return CourseEnrollmentListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{course_enrollment_id}", response_model=CourseEnrollmentRead, dependencies=[Depends(require_permission("courses.read"))])
def get_enrollment(
    course_enrollment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CourseEnrollmentsService = Depends(get_service),
):
    item = svc.get(course_enrollment_id)
    if not is_platform_admin(db, current_user) and svc.repo.get_course_organization_id(item.course_id) != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course enrollment not found")
    return item


@router.patch("/{course_enrollment_id}", response_model=CourseEnrollmentRead, dependencies=[Depends(require_permission("courses.manage"))])
def update_enrollment(
    course_enrollment_id: int,
    payload: CourseEnrollmentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CourseEnrollmentsService = Depends(get_service),
):
    item = svc.get(course_enrollment_id)
    if not is_platform_admin(db, current_user) and svc.repo.get_course_organization_id(item.course_id) != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course enrollment not found")
    return svc.update(course_enrollment_id, payload)


@router.delete("/{course_enrollment_id}", response_model=CourseEnrollmentRead, dependencies=[Depends(require_permission("courses.manage"))])
def delete_enrollment(
    course_enrollment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: CourseEnrollmentsService = Depends(get_service),
):
    item = svc.get(course_enrollment_id)
    if not is_platform_admin(db, current_user) and svc.repo.get_course_organization_id(item.course_id) != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course enrollment not found")
    return svc.cancel(course_enrollment_id)

