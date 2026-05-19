from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enums import CourseStatus
from app.modules.courses.repository import CoursesRepository
from app.modules.courses.schemas import (
    CourseCreate,
    CourseDashboardStats,
    CourseEnrollmentMonthBucket,
    CourseListItemRead,
    CourseRead,
    CourseRecentActivityItem,
    CourseStatusCount,
    CourseTopItem,
    CourseUpdate,
)


class CoursesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CoursesRepository(db)

    def _validate_owner(self, organization_id: int | None, owner_user_id: int | None) -> None:
        # Must satisfy model constraint: exactly one owner.
        if (organization_id is None and owner_user_id is None) or (organization_id is not None and owner_user_id is not None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide exactly one of organization_id or owner_user_id",
            )
        if organization_id is not None and not self.repo.organization_exists(organization_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")
        if owner_user_id is not None and not self.repo.user_exists(owner_user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner user not found")

    def create(self, payload: CourseCreate) -> Course:
        if self.repo.get_by_slug(payload.slug) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

        org_id = self.repo.get_organization_id(
            organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
        )
        owner_id = self.repo.get_owner_user_id(
            owner_user_id=payload.owner_user_id, owner_user_uuid=payload.owner_user_uuid
        )
        self._validate_owner(org_id, owner_id)

        course = Course(
            organization_id=org_id,
            owner_user_id=owner_id,
            title=payload.title,
            slug=payload.slug,
            description=payload.description,
            cover_image_url=payload.cover_image_url,
            category=payload.category,
            status=payload.status,
        )
        self.repo.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None,
        owner_user_id: int | None,
        status_filter: CourseStatus | None,
        search: str | None,
    ) -> tuple[list[CourseListItemRead], int]:
        courses, total = self.repo.list(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            owner_user_id=owner_user_id,
            status=status_filter,
            search=search,
        )
        return self._enrich_list_items(courses), total

    def _enrich_list_items(self, courses: list[Course]) -> list[CourseListItemRead]:
        if not courses:
            return []
        ids = [c.id for c in courses]
        owner_ids = [c.owner_user_id for c in courses if c.owner_user_id is not None]
        ec = self.repo.enrollment_counts_by_course_ids(ids)
        users_map = self.repo.user_display_by_ids(list(set(owner_ids)))
        out: list[CourseListItemRead] = []
        for c in courses:
            disp: str | None = None
            email: str | None = None
            if c.owner_user_id is not None and c.owner_user_id in users_map:
                disp, email = users_map[c.owner_user_id]
            base = CourseRead.model_validate(c)
            out.append(
                CourseListItemRead(
                    **base.model_dump(),
                    enrollment_count=ec.get(c.id, 0),
                    instructor_display_name=disp,
                    instructor_email=email,
                ),
            )
        return out

    def dashboard_stats(self, *, organization_id: int | None = None) -> CourseDashboardStats:
        total = self.repo.total_courses(organization_id=organization_id)
        by_s = self.repo.counts_courses_by_status(organization_id=organization_id)
        published = int(by_s.get(CourseStatus.published, 0))
        draft = int(by_s.get(CourseStatus.draft, 0))
        archived = int(by_s.get(CourseStatus.archived, 0))
        enroll_total = self.repo.total_enrollments(organization_id=organization_id)
        order = [CourseStatus.draft, CourseStatus.published, CourseStatus.archived]
        by_status = [CourseStatusCount(status=s, count=int(by_s.get(s, 0))) for s in order]
        months = [
            CourseEnrollmentMonthBucket(month=m, count=n)
            for m, n in self.repo.enrollments_by_month_last(months=6, organization_id=organization_id)
        ]
        top_rows = self.repo.top_courses_by_enrollments(limit=5, organization_id=organization_id)
        top_courses = [CourseTopItem(course_id=i, title=t, slug=s, enrollment_count=n) for i, t, s, n in top_rows]
        recent = self.repo.recent_courses_by_updated(limit=8, organization_id=organization_id)
        recent_activity = [
            CourseRecentActivityItem(course_id=c.id, title=c.title, slug=c.slug, updated_at=c.updated_at) for c in recent
        ]
        return CourseDashboardStats(
            total_courses=total,
            published_count=published,
            draft_count=draft,
            archived_count=archived,
            total_enrollments=enroll_total,
            by_status=by_status,
            enrollments_by_month=months,
            top_courses=top_courses,
            recent_activity=recent_activity,
        )

    def get(self, course_id: int) -> Course:
        course = self.repo.get(course_id)
        if course is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        return course

    def update(self, course_id: int, payload: CourseUpdate) -> Course:
        course = self.get(course_id)
        fields_set = payload.model_fields_set

        if payload.slug is not None and payload.slug != course.slug:
            if self.repo.get_by_slug(payload.slug) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")
            course.slug = payload.slug

        if payload.title is not None:
            course.title = payload.title
        if "description" in fields_set:
            course.description = payload.description
        if "cover_image_url" in fields_set:
            course.cover_image_url = payload.cover_image_url
        if "category" in fields_set:
            course.category = payload.category
        if payload.status is not None:
            course.status = payload.status

        if (
            "organization_id" in fields_set
            or "organization_uuid" in fields_set
            or "owner_user_id" in fields_set
            or "owner_user_uuid" in fields_set
        ):
            new_org_input = payload.organization_id if "organization_id" in fields_set else course.organization_id
            new_org_uuid = payload.organization_uuid if "organization_uuid" in fields_set else None
            new_owner_input = payload.owner_user_id if "owner_user_id" in fields_set else course.owner_user_id
            new_owner_uuid = payload.owner_user_uuid if "owner_user_uuid" in fields_set else None

            new_org = self.repo.get_organization_id(organization_id=new_org_input, organization_uuid=new_org_uuid)
            new_owner = self.repo.get_owner_user_id(owner_user_id=new_owner_input, owner_user_uuid=new_owner_uuid)
            self._validate_owner(new_org, new_owner)
            course.organization_id = new_org
            course.owner_user_id = new_owner

        self.db.commit()
        self.db.refresh(course)
        return course

    def archive(self, course_id: int) -> Course:
        course = self.get(course_id)
        course.status = CourseStatus.archived
        self.db.commit()
        self.db.refresh(course)
        return course

