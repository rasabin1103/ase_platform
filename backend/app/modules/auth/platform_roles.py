"""Platform roles assigned directly to users (no organization membership)."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.models.user_platform_role import UserPlatformRole


def _get_role(db: Session, role_code: str) -> Role | None:
    return db.execute(select(Role).where(Role.code == role_code)).scalar_one_or_none()


def get_user_platform_role_codes(db: Session, *, user_id: int) -> list[str]:
    stmt = (
        select(Role.code)
        .join(UserPlatformRole, UserPlatformRole.role_id == Role.id)
        .where(UserPlatformRole.user_id == user_id)
        .order_by(Role.code.asc())
    )
    return list(db.execute(stmt).scalars().all())


def user_has_platform_role(db: Session, *, user_id: int, role_code: str) -> bool:
    stmt = (
        select(Role.id)
        .join(UserPlatformRole, UserPlatformRole.role_id == Role.id)
        .where(UserPlatformRole.user_id == user_id, Role.code == role_code)
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none() is not None


def clear_user_platform_roles(db: Session, user_id: int) -> None:
    db.execute(delete(UserPlatformRole).where(UserPlatformRole.user_id == user_id))


def assign_user_platform_role(
    db: Session,
    *,
    user: User,
    role_code: str,
    assigner_id: int,
) -> None:
    """Replace all platform-scoped roles for this user with a single role."""
    role = _get_role(db, role_code)
    if role is None:
        raise ValueError(f"unknown_role:{role_code}")

    clear_user_platform_roles(db, user.id)
    db.add(
        UserPlatformRole(
            user_id=user.id,
            role_id=role.id,
            assigned_by_user_id=assigner_id,
        )
    )
    db.flush()


def assign_independent_user_on_signup(db: Session, *, user: User) -> None:
    """Default role for self-service registration (no organization)."""
    assign_user_platform_role(
        db,
        user=user,
        role_code="independent_user",
        assigner_id=user.id,
    )
