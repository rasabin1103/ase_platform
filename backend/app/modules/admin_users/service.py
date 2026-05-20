from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.media_urls import resolve_user_avatar_url
from app.core.security import hash_password
from app.models.enums import UserStatus
from app.models.user import User
from app.modules.admin_users.repository import AdminUsersRepository
from app.modules.admin_users.role_ops import (
    _get_role,
    assign_platform_role,
    count_users_with_role,
    get_role_codes_for_user,
    resolve_primary_platform_role,
)
from app.modules.admin_users.schemas import (
    AdminUserCreate,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserStatusPatch,
    AdminUserUpdate,
    MVP_PLATFORM_ROLE_CODES,
)


class AdminUsersService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminUsersRepository(db)

    def _validate_role_code(self, role_code: str) -> None:
        if role_code in MVP_PLATFORM_ROLE_CODES:
            return
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role {role_code!r} is not available. Supported: {', '.join(sorted(MVP_PLATFORM_ROLE_CODES))}",
        )

    def _ensure_role_exists(self, role_code: str) -> None:
        self._validate_role_code(role_code)
        if _get_role(self.db, role_code) is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role {role_code!r} does not exist in the database",
            )

    def _to_read(self, user: User) -> AdminUserRead:
        role_codes = get_role_codes_for_user(self.db, user.id)
        return AdminUserRead(
            id=user.id,
            uuid=user.uuid,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            display_name=user.display_name,
            phone_e164=user.phone_e164,
            status=user.status,
            primary_role=resolve_primary_platform_role(role_codes),
            roles=role_codes,
            avatar_url=resolve_user_avatar_url(user),
            can_create_content=bool(user.can_create_content),
            creator_status=user.creator_status,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
        )

    def list_users(
        self,
        *,
        limit: int,
        offset: int,
        status: UserStatus | None,
        role: str | None,
        search: str | None,
    ) -> AdminUserListResponse:
        if role:
            self._validate_role_code(role)
        items, total = self.repo.list_platform_users(
            limit=limit,
            offset=offset,
            status=status,
            role_code=role,
            search=search,
        )
        return AdminUserListResponse(
            items=[self._to_read(u) for u in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def get_user(self, user_uuid: UUID) -> AdminUserRead:
        user = self.repo.get_by_uuid(user_uuid)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return self._to_read(user)

    def create_user(self, payload: AdminUserCreate, *, actor: User) -> AdminUserRead:
        self._ensure_role_exists(payload.role)

        if self.repo.users.get_by_email(str(payload.email)) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        if payload.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create user as deleted")

        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=payload.display_name,
            status=payload.status,
            can_create_content=payload.can_create_content,
            creator_status=payload.creator_status,
        )
        self.repo.add(user)
        try:
            assign_platform_role(
                self.db,
                user=user,
                role_code=payload.role,
                assigner_id=actor.id,
            )
            self.db.commit()
        except ValueError as exc:
            self.db.rollback()
            code = str(exc).split(":", 1)[-1]
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=code) from exc
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user") from exc

        self.db.refresh(user)
        return self._to_read(user)

    def update_user(self, user_uuid: UUID, payload: AdminUserUpdate, *, actor: User) -> AdminUserRead:
        user = self.repo.get_by_uuid(user_uuid)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.display_name is not None:
            user.display_name = payload.display_name
        if payload.phone_e164 is not None:
            user.phone_e164 = payload.phone_e164 or None
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.can_create_content is not None:
            user.can_create_content = payload.can_create_content
        if payload.creator_status is not None:
            user.creator_status = payload.creator_status
        if payload.status is not None:
            if payload.status == UserStatus.deleted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Use DELETE to remove users; set inactive or suspended instead",
                )
            user.status = payload.status

        if payload.role is not None:
            self._ensure_role_exists(payload.role)
            try:
                assign_platform_role(
                    self.db,
                    user=user,
                    role_code=payload.role,
                    assigner_id=actor.id,
                )
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(exc).split(":", 1)[-1],
                ) from exc

        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            if "phone_e164" in str(exc.orig).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already in use") from exc
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not update user") from exc

        self.db.refresh(user)
        return self._to_read(user)

    def patch_status(self, user_uuid: UUID, payload: AdminUserStatusPatch, *, actor: User) -> AdminUserRead:
        allowed = {UserStatus.active, UserStatus.inactive, UserStatus.suspended}
        if payload.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be active, inactive, or suspended",
            )
        user = self.repo.get_by_uuid(user_uuid)
        if user is None or user.status == UserStatus.deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.status = payload.status
        self.db.commit()
        self.db.refresh(user)
        return self._to_read(user)

    def hard_delete_user(self, user_uuid: UUID, *, actor: User) -> None:
        target = self.repo.get_by_uuid(user_uuid)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if target.id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account",
            )

        role_codes = get_role_codes_for_user(self.db, target.id)
        if "super_admin" in role_codes and count_users_with_role(self.db, "super_admin") <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last super_admin in the system",
            )

        self.repo.delete_user_related_rows(target.id, reassign_org_owner_to=actor.id)
        self.repo.hard_delete_user_row(target)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User could not be deleted due to remaining references",
            ) from exc
