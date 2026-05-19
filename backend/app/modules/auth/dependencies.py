from __future__ import annotations

from typing import Callable
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import ALL_PERMISSION_CODES, expand_permission_codes, resolve_primary_role
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.modules.auth.security import get_token_subject_uuid
from app.modules.users.repository import UsersRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        user_uuid = get_token_subject_uuid(token, expected_type="access")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = UsersRepository(db).get_by_uuid(user_uuid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if user.status != UserStatus.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not active")
    return user


def get_current_organization(
    x_organization_uuid: str | None = Header(default=None, alias="X-Organization-UUID"),
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme_optional),
) -> Organization:
    if x_organization_uuid is None or not x_organization_uuid.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-Organization-UUID header is required")

    try:
        org_uuid = UUID(x_organization_uuid)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-Organization-UUID")

    if token is None or not token.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    try:
        user_uuid = get_token_subject_uuid(token, expected_type="access")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = UsersRepository(db).get_by_uuid(user_uuid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    org = db.execute(select(Organization).where(Organization.uuid == org_uuid)).scalar_one_or_none()
    if org is None or org.status != OrganizationStatus.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if user.status in (UserStatus.suspended, UserStatus.deleted):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not allowed")

    member = db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == user.id,
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
    if member.membership_status != MembershipStatus.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership is not active")

    return org


def _resolve_org_id_from_request(request: Request, db: Session) -> int | None:
    def _get(name: str) -> str | None:
        if name in request.path_params:
            return str(request.path_params[name])
        if name in request.query_params:
            return str(request.query_params[name])
        return None

    for k in ("organization_id", "org_id"):
        v = _get(k)
        if v:
            try:
                return int(v)
            except ValueError:
                return None

    for k in ("organization_uuid", "org_uuid"):
        v = _get(k)
        if v:
            try:
                ou = UUID(v)
            except Exception:
                return None
            stmt = select(Organization.id).where(
                Organization.uuid == ou,
                Organization.status == OrganizationStatus.active,
            )
            return db.execute(stmt).scalar_one_or_none()

    header_uuid = request.headers.get("X-Organization-UUID")
    if header_uuid and header_uuid.strip():
        try:
            ou = UUID(header_uuid)
        except Exception:
            return None
        stmt = select(Organization.id).where(
            Organization.uuid == ou,
            Organization.status == OrganizationStatus.active,
        )
        return db.execute(stmt).scalar_one_or_none()

    return None


def get_default_organization_id(db: Session, user: User) -> int | None:
    """Pick the user's primary workspace when X-Organization-UUID is omitted (MVP-friendly)."""
    if is_super_admin(db, user):
        platform_id = db.execute(
            select(Organization.id)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(
                OrganizationMember.user_id == user.id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Organization.status == OrganizationStatus.active,
                Role.code == "super_admin",
            )
            .order_by(OrganizationMember.id.asc())
            .limit(1)
        ).scalar_one_or_none()
        if platform_id is not None:
            return int(platform_id)

    if is_independent_user(db, user):
        personal_id = db.execute(
            select(Organization.id)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(
                OrganizationMember.user_id == user.id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Organization.status == OrganizationStatus.active,
                Organization.type == OrganizationType.individual,
                Role.code == "independent_user",
            )
            .order_by(OrganizationMember.id.asc())
            .limit(1)
        ).scalar_one_or_none()
        if personal_id is not None:
            return int(personal_id)

    fallback = db.execute(
        select(Organization.id)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Organization.status == OrganizationStatus.active,
        )
        .order_by(OrganizationMember.id.asc())
        .limit(1)
    ).scalar_one_or_none()
    return int(fallback) if fallback is not None else None


def get_default_organization_uuid(db: Session, user: User) -> UUID | None:
    org_id = get_default_organization_id(db, user)
    if org_id is None:
        return None
    return db.execute(select(Organization.uuid).where(Organization.id == org_id)).scalar_one_or_none()


def _resolve_effective_org_id(request: Request, db: Session, user: User) -> int | None:
    return _resolve_org_id_from_request(request, db) or get_default_organization_id(db, user)


def _user_has_role_on_membership(db: Session, *, user_id: int, role_code: str) -> bool:
    stmt = (
        select(func.count())
        .select_from(MemberRole)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .join(Role, Role.id == MemberRole.role_id)
        .where(OrganizationMember.user_id == user_id, Role.code == role_code)
    )
    return int(db.execute(stmt).scalar_one()) > 0


def is_super_admin(db: Session, user: User) -> bool:
    return _user_has_role_on_membership(db, user_id=user.id, role_code="super_admin")


def is_independent_user(db: Session, user: User, *, organization_id: int | None = None) -> bool:
    stmt = (
        select(func.count())
        .select_from(MemberRole)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .join(Role, Role.id == MemberRole.role_id)
        .where(OrganizationMember.user_id == user.id, Role.code == "independent_user")
    )
    if organization_id is not None:
        stmt = stmt.where(OrganizationMember.organization_id == organization_id)
    return int(db.execute(stmt).scalar_one()) > 0


def is_platform_admin(db: Session, current_user: User) -> bool:
    return is_super_admin(db, current_user)


def user_has_role_assigned(db: Session, *, user_id: int, role_code: str) -> bool:
    return _user_has_role_on_membership(db, user_id=user_id, role_code=role_code)


def get_user_role_codes(db: Session, *, user_id: int, organization_id: int | None = None) -> list[str]:
    stmt = (
        select(Role.code)
        .join(MemberRole, MemberRole.role_id == Role.id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .where(OrganizationMember.user_id == user_id)
        .order_by(Role.code.asc())
    )
    if organization_id is not None:
        stmt = stmt.where(OrganizationMember.organization_id == organization_id)
    return list(db.execute(stmt).scalars().all())


def get_user_permissions(db: Session, *, user_id: int, organization_id: int | None = None) -> list[str]:
    if _user_has_role_on_membership(db, user_id=user_id, role_code="super_admin"):
        return sorted(ALL_PERMISSION_CODES)

    stmt = (
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(MemberRole, MemberRole.role_id == Role.id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .where(
            OrganizationMember.user_id == user_id,
            OrganizationMember.membership_status == MembershipStatus.active,
        )
        .distinct()
        .order_by(Permission.code.asc())
    )
    if organization_id is not None:
        stmt = stmt.where(OrganizationMember.organization_id == organization_id)
    return list(db.execute(stmt).scalars().all())


def user_has_any_permission(
    db: Session,
    *,
    user_id: int,
    organization_id: int,
    permission_codes: frozenset[str],
) -> bool:
    if _user_has_role_on_membership(db, user_id=user_id, role_code="super_admin"):
        return True
    stmt = (
        select(func.count())
        .select_from(Permission)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(MemberRole, MemberRole.role_id == Role.id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Permission.code.in_(permission_codes),
        )
    )
    return int(db.execute(stmt).scalar_one()) > 0


def require_organization_context(request: Request, db: Session, user: User) -> Organization:
    if user.status in (UserStatus.suspended, UserStatus.deleted):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not allowed")

    org_id = _resolve_effective_org_id(request, db, user)
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No workspace is associated with this user. Complete onboarding or contact support.",
        )

    org = db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if is_super_admin(db, user):
        return org

    member = db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == user.id,
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
    if member.membership_status != MembershipStatus.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership is not active")
    return org


def require_same_organization(
    request: Request,
    db: Session,
    user: User,
    *,
    target_organization_id: int,
) -> Organization:
    org = require_organization_context(request, db, user)
    if not is_super_admin(db, user) and org.id != target_organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access denied")
    return org


def require_organization_member() -> Callable[..., OrganizationMember]:
    def _dep(
        request: Request,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> OrganizationMember:
        if user.status in (UserStatus.suspended, UserStatus.deleted):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not allowed")

        org_id = _resolve_effective_org_id(request, db, user)
        if org_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No workspace is associated with this user.",
            )

        stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user.id,
        )
        member = db.execute(stmt).scalar_one_or_none()
        if member is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
        if member.membership_status != MembershipStatus.active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership is not active")
        return member

    return _dep


def require_tenant_context(request: Request, db: Session, current_user: User) -> Organization:
    if is_super_admin(db, current_user):
        org_id = _resolve_effective_org_id(request, db, current_user)
        if org_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No workspace is associated with this user.",
            )
        org = db.get(Organization, org_id)
        if org is None or org.status != OrganizationStatus.active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return org
    return require_organization_context(request, db, current_user)


def require_platform_role(role_code: str) -> Callable[..., None]:
    def _dep(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
        if user.status in (UserStatus.suspended, UserStatus.deleted):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not allowed")
        if not _user_has_role_on_membership(db, user_id=user.id, role_code=role_code):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing role")

    return _dep


def require_permission(permission_code: str) -> Callable[..., None]:
    def _dep(
        request: Request,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> None:
        if user.status in (UserStatus.suspended, UserStatus.deleted):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not allowed")

        if is_super_admin(db, user):
            return

        codes = expand_permission_codes(permission_code)
        org_id = _resolve_effective_org_id(request, db, user)
        if org_id is not None:
            if user_has_any_permission(
                db, user_id=user.id, organization_id=org_id, permission_codes=codes
            ):
                return
        else:
            user_perms = set(get_user_permissions(db, user_id=user.id, organization_id=None))
            if codes.intersection(user_perms):
                return

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")

    return _dep


def get_rbac_context(
    db: Session,
    user: User,
    *,
    organization_id: int | None = None,
) -> dict:
    role_codes = get_user_role_codes(db, user_id=user.id, organization_id=organization_id)
    permissions = get_user_permissions(db, user_id=user.id, organization_id=organization_id)
    return {
        "role_codes": role_codes,
        "permissions": permissions,
        "primary_role": resolve_primary_role(role_codes),
        "is_superuser": is_super_admin(db, user),
        "is_independent_user": is_independent_user(db, user, organization_id=organization_id),
    }
