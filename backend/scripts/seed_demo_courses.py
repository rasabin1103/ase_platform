from __future__ import annotations

"""
Idempotent demo seed for courses, instructors, students and enrollments.

Rules:
- Does NOT delete existing data.
- Creates demo instructor and student users by email if missing.
- Creates demo courses by slug if missing (user-owned courses).
- Adds enrollments only when the (course_id, user_id) pair does not exist yet.
"""

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.database import SessionLocal
from app.models.course import Course
from app.models.course_enrollment import CourseEnrollment
from app.models.enums import CourseStatus, EnrollmentStatus, UserStatus
from app.models.user import User
from app.core.security import hash_password

DEMO_PASSWORD = "DemoSeed123!"


@dataclass(frozen=True)
class InstructorSpec:
    email: str
    display_name: str
    first_name: str
    last_name: str


@dataclass(frozen=True)
class CourseSpec:
    slug: str
    title: str
    description: str
    status: CourseStatus
    category: str
    cover_image_url: str | None
    instructor_email: str
    student_emails: tuple[str, ...]


INSTRUCTORS: tuple[InstructorSpec, ...] = (
    InstructorSpec("instructor.demo@ase.local", "Marina Ortega", "Marina", "Ortega"),
    InstructorSpec("instructor.automation@ase.local", "Carlos Vega", "Carlos", "Vega"),
    InstructorSpec("instructor.performance@ase.local", "Laura Méndez", "Laura", "Méndez"),
)

STUDENT_EMAILS: tuple[str, ...] = tuple(f"student.demo.{i:02d}@ase.local" for i in range(1, 19))

COURSE_SPECS: tuple[CourseSpec, ...] = (
    CourseSpec(
        slug="intro-playwright",
        title="Introducción a Playwright",
        description="Curso práctico de automatización end-to-end con Playwright, fixtures y CI.",
        status=CourseStatus.published,
        category="Automatización",
        cover_image_url="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
        instructor_email="instructor.demo@ase.local",
        student_emails=STUDENT_EMAILS[:8],
    ),
    CourseSpec(
        slug="ia-qa-engineers",
        title="IA para QA Engineers",
        description="Uso responsable de modelos generativos en estrategias de prueba y documentación.",
        status=CourseStatus.published,
        category="IA",
        cover_image_url="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        instructor_email="instructor.demo@ase.local",
        student_emails=STUDENT_EMAILS[4:14],
    ),
    CourseSpec(
        slug="api-testing-postman",
        title="API Testing con Postman",
        description="Diseño de colecciones, aserciones y flujos de regresión sobre APIs REST.",
        status=CourseStatus.draft,
        category="APIs",
        cover_image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
        instructor_email="instructor.automation@ase.local",
        student_emails=STUDENT_EMAILS[6:12],
    ),
    CourseSpec(
        slug="selenium-web-automation",
        title="Automatización Web con Selenium",
        description="Patrones Page Object, esperas explícitas y ejecución estable en navegadores.",
        status=CourseStatus.published,
        category="Automatización",
        cover_image_url="https://images.unsplash.com/photo-1461747287627-d57db30e303f?w=800&q=80",
        instructor_email="instructor.automation@ase.local",
        student_emails=STUDENT_EMAILS[2:16],
    ),
    CourseSpec(
        slug="performance-jmeter",
        title="Performance Testing con JMeter",
        description="Planes de carga, correlación y lectura de resultados para servicios críticos.",
        status=CourseStatus.archived,
        category="Performance",
        cover_image_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        instructor_email="instructor.performance@ase.local",
        student_emails=STUDENT_EMAILS[8:18],
    ),
)


def _get_or_create_user(
    db: Session,
    *,
    email: str,
    display_name: str,
    first_name: str,
    last_name: str,
) -> User:
    u = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if u is not None:
        return u
    u = User(
        email=email,
        password_hash=hash_password(DEMO_PASSWORD),
        display_name=display_name,
        first_name=first_name,
        last_name=last_name,
        status=UserStatus.active,
    )
    db.add(u)
    db.flush()
    return u


def _get_or_create_course(
    db: Session,
    *,
    spec: CourseSpec,
    owner_user_id: int,
    created_offset_days: int,
) -> Course:
    c = db.execute(select(Course).where(Course.slug == spec.slug)).scalar_one_or_none()
    if c is not None:
        return c
    created_at = datetime.now(timezone.utc) - timedelta(days=created_offset_days)
    c = Course(
        organization_id=None,
        owner_user_id=owner_user_id,
        title=spec.title,
        slug=spec.slug,
        description=spec.description,
        cover_image_url=spec.cover_image_url,
        category=spec.category,
        status=spec.status,
    )
    db.add(c)
    db.flush()
    # Preserve narrative timeline for dashboards (SQLAlchemy defaults already set created_at).
    c.created_at = created_at
    c.updated_at = created_at + timedelta(days=1)
    db.flush()
    return c


def _enrollment_exists(db: Session, *, course_id: int, user_id: int) -> bool:
    stmt = select(CourseEnrollment.id).where(CourseEnrollment.course_id == course_id, CourseEnrollment.user_id == user_id).limit(1)
    return db.execute(stmt).scalar_one_or_none() is not None


def seed_demo_courses(db: Session) -> tuple[int, int, int]:
    """Returns (courses_created, users_created, enrollments_created)."""
    courses_created = 0
    users_created = 0
    enrollments_created = 0

    for ins in INSTRUCTORS:
        existed = db.execute(select(User.id).where(User.email == ins.email)).scalar_one_or_none() is not None
        _get_or_create_user(
            db,
            email=ins.email,
            display_name=ins.display_name,
            first_name=ins.first_name,
            last_name=ins.last_name,
        )
        if not existed:
            users_created += 1

    for idx, email in enumerate(STUDENT_EMAILS):
        existed = db.execute(select(User.id).where(User.email == email)).scalar_one_or_none() is not None
        n = idx + 1
        label = f"Student {n:02d}"
        _get_or_create_user(
            db,
            email=email,
            display_name=label,
            first_name="Student",
            last_name=f"{n:02d}",
        )
        if not existed:
            users_created += 1

    instructor_by_email: dict[str, User] = {}
    for ins in INSTRUCTORS:
        instructor_by_email[ins.email] = db.execute(select(User).where(User.email == ins.email)).scalar_one()

    student_by_email: dict[str, User] = {
        e: db.execute(select(User).where(User.email == e)).scalar_one() for e in STUDENT_EMAILS
    }

    for i, spec in enumerate(COURSE_SPECS):
        owner = instructor_by_email.get(spec.instructor_email)
        if owner is None:
            raise RuntimeError(f"Missing instructor {spec.instructor_email}")
        existed_course = db.execute(select(Course.id).where(Course.slug == spec.slug)).scalar_one_or_none() is not None
        course = _get_or_create_course(db, spec=spec, owner_user_id=owner.id, created_offset_days=120 - i * 14)
        if not existed_course:
            courses_created += 1

        base_enroll = datetime.now(timezone.utc) - timedelta(days=90 - i * 5)
        for j, semail in enumerate(spec.student_emails):
            student = student_by_email.get(semail)
            if student is None:
                continue
            if _enrollment_exists(db, course_id=course.id, user_id=student.id):
                continue
            enrolled_at = base_enroll + timedelta(days=j * 2)
            en = CourseEnrollment(
                course_id=course.id,
                user_id=student.id,
                status=EnrollmentStatus.active,
                enrolled_at=enrolled_at,
            )
            db.add(en)
            db.flush()
            enrollments_created += 1

    return courses_created, users_created, enrollments_created


def main() -> None:
    db = SessionLocal()
    try:
        cc, uc, ec = seed_demo_courses(db)
        db.commit()
        print(f"Demo courses seed completed. courses_created={cc} users_created={uc} enrollments_created={ec}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
