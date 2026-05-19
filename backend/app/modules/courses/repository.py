from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.course_enrollment import CourseEnrollment
from app.models.enums import CourseStatus
from app.models.organization import Organization
from app.models.user import User


class CoursesRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, course_id: int) -> Course | None:
        stmt = select(Course).where(Course.id == course_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Course | None:
        stmt = select(Course).where(Course.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none()

    def organization_exists(self, organization_id: int) -> bool:
        stmt = select(func.count()).select_from(Organization).where(Organization.id == organization_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def user_exists(self, user_id: int) -> bool:
        stmt = select(func.count()).select_from(User).where(User.id == user_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get_organization_id(self, *, organization_id: int | None, organization_uuid: UUID | None) -> int | None:
        if organization_id is not None:
            return organization_id
        if organization_uuid is None:
            return None
        stmt = select(Organization.id).where(Organization.uuid == organization_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_owner_user_id(self, *, owner_user_id: int | None, owner_user_uuid: UUID | None) -> int | None:
        if owner_user_id is not None:
            return owner_user_id
        if owner_user_uuid is None:
            return None
        stmt = select(User.id).where(User.uuid == owner_user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        owner_user_id: int | None = None,
        status: CourseStatus | None = None,
        search: str | None = None,
    ) -> tuple[list[Course], int]:
        base = select(Course)
        if organization_id is not None:
            base = base.where(Course.organization_id == organization_id)
        if owner_user_id is not None:
            base = base.where(Course.owner_user_id == owner_user_id)
        if status is not None:
            base = base.where(Course.status == status)
        if search and search.strip():
            term = f"%{search.strip()}%"
            base = base.where(or_(Course.title.ilike(term), Course.slug.ilike(term)))

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Course.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def enrollment_counts_by_course_ids(self, course_ids: list[int]) -> dict[int, int]:
        if not course_ids:
            return {}
        stmt = (
            select(CourseEnrollment.course_id, func.count())
            .where(CourseEnrollment.course_id.in_(course_ids))
            .group_by(CourseEnrollment.course_id)
        )
        rows = self.db.execute(stmt).all()
        return {int(r[0]): int(r[1]) for r in rows}

    def user_display_by_ids(self, user_ids: list[int]) -> dict[int, tuple[str | None, str]]:
        if not user_ids:
            return {}
        stmt = select(User.id, User.email, User.display_name, User.first_name, User.last_name).where(User.id.in_(user_ids))
        rows = self.db.execute(stmt).all()
        out: dict[int, tuple[str | None, str]] = {}
        for uid, email, dname, fn, ln in rows:
            parts = " ".join(x for x in (fn or "", ln or "") if x).strip()
            label = (dname or "").strip() or parts or str(email)
            out[int(uid)] = (label or None, str(email))
        return out

    def total_courses(self, *, organization_id: int | None = None) -> int:
        stmt = select(func.count()).select_from(Course)
        if organization_id is not None:
            stmt = stmt.where(Course.organization_id == organization_id)
        return int(self.db.execute(stmt).scalar_one())

    def total_enrollments(self, *, organization_id: int | None = None) -> int:
        stmt = select(func.count()).select_from(CourseEnrollment)
        if organization_id is not None:
            stmt = stmt.join(Course, Course.id == CourseEnrollment.course_id).where(Course.organization_id == organization_id)
        return int(self.db.execute(stmt).scalar_one())

    def counts_courses_by_status(self, *, organization_id: int | None = None) -> dict[CourseStatus, int]:
        stmt = select(Course.status, func.count()).group_by(Course.status)
        if organization_id is not None:
            stmt = stmt.where(Course.organization_id == organization_id)
        rows = self.db.execute(stmt).all()
        return {CourseStatus(r[0]): int(r[1]) for r in rows}

    def enrollments_by_month_last(self, *, months: int = 6, organization_id: int | None = None) -> list[tuple[str, int]]:
        since = datetime.now(timezone.utc) - timedelta(days=32 * months)
        bucket = func.date_trunc("month", CourseEnrollment.enrolled_at).label("m")
        stmt = (
            select(bucket, func.count())
            .group_by(bucket)
            .order_by(bucket.asc())
        )
        if organization_id is not None:
            stmt = stmt.join(Course, Course.id == CourseEnrollment.course_id).where(Course.organization_id == organization_id)
        stmt = stmt.where(CourseEnrollment.enrolled_at >= since)
        rows = self.db.execute(stmt).all()
        out: list[tuple[str, int]] = []
        for m, cnt in rows:
            if m is None:
                continue
            label = m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)[:7]
            out.append((label, int(cnt)))
        return out

    def top_courses_by_enrollments(self, *, limit: int = 5, organization_id: int | None = None) -> list[tuple[int, str, str, int]]:
        stmt = (
            select(Course.id, Course.title, Course.slug, func.count(CourseEnrollment.id))
            .join(CourseEnrollment, CourseEnrollment.course_id == Course.id)
            .group_by(Course.id)
            .order_by(func.count(CourseEnrollment.id).desc())
            .limit(limit)
        )
        if organization_id is not None:
            stmt = stmt.where(Course.organization_id == organization_id)
        rows = self.db.execute(stmt).all()
        return [(int(r[0]), str(r[1]), str(r[2]), int(r[3])) for r in rows]

    def recent_courses_by_updated(self, *, limit: int = 8, organization_id: int | None = None) -> list[Course]:
        stmt = select(Course)
        if organization_id is not None:
            stmt = stmt.where(Course.organization_id == organization_id)
        stmt = stmt.order_by(Course.updated_at.desc()).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def add(self, course: Course) -> Course:
        self.db.add(course)
        self.db.flush()
        return course

