from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.models.user import User
from app.modules.admin_data_reset.domains import (
    DATA_DOMAINS,
    DATA_DOMAINS_BY_KEY,
    MASTER_CONFIRM_PHRASE,
    PLAIN_DOMAINS,
    PROTECTED_TABLES,
    DataDomain,
)
from app.modules.auth.security import verify_password


class DataResetError(Exception):
    """Raised for any client-correctable failure (bad phrase, bad password,
    unknown domain) — the router turns this into an HTTP 400/403."""


@dataclass(frozen=True)
class DomainInfo:
    domain: DataDomain
    row_count: int
    extra_tables: tuple[str, ...]  # tables also wiped as a side effect (FK cascade), beyond `domain.tables`


@dataclass(frozen=True)
class ResetResult:
    tables_wiped: tuple[str, ...]
    rows_deleted: int
    preserved_user_email: str
    preserved_org_id: int | None


def _quote(table: str) -> str:
    return f'"{table}"'


def table_row_count(db: Session, table: str) -> int:
    # table always comes from the static DATA_DOMAINS registry, never from
    # request input, so building the identifier this way is safe.
    return int(db.execute(text(f"SELECT COUNT(*) FROM {_quote(table)}")).scalar_one())


def compute_cascade_closure(db: Session, tables: set[str]) -> set[str]:
    """Every table that `TRUNCATE ... CASCADE` on `tables` would also empty,
    computed transitively from Postgres' own catalogs — the same dependency
    graph Postgres itself walks, so the preview shown to the admin can never
    drift from what actually happens."""
    closure = set(tables)
    frontier = set(tables)
    stmt = text(
        """
        SELECT DISTINCT tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
         AND tc.constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND ccu.table_name IN :targets
        """
    ).bindparams(bindparam("targets", expanding=True))
    while frontier:
        rows = db.execute(stmt, {"targets": list(frontier)}).scalars().all()
        new_tables = set(rows) - closure
        closure |= new_tables
        frontier = new_tables
    return closure


def get_super_admin_org_id(db: Session, user: User) -> int | None:
    return db.execute(
        text(
            """
            SELECT om.organization_id
            FROM organization_members om
            JOIN member_roles mr ON mr.organization_member_id = om.id
            JOIN roles r ON r.id = mr.role_id
            WHERE om.user_id = :uid AND r.code = 'super_admin'
            ORDER BY om.id ASC
            LIMIT 1
            """
        ),
        {"uid": user.id},
    ).scalar_one_or_none()


def list_domains(db: Session, current_user: User) -> list[DomainInfo]:
    out: list[DomainInfo] = []
    for domain in DATA_DOMAINS:
        own = set(domain.tables)
        if domain.special is None:
            closure = compute_cascade_closure(db, own) - PROTECTED_TABLES
            extra = tuple(sorted(closure - own))
            row_count = sum(table_row_count(db, t) for t in own)
        else:
            # Special domains ("organizations", "users") are wiped with a
            # preserving DELETE, not a blind TRUNCATE CASCADE, so their real
            # extra impact follows each dependent table's own FK ondelete
            # rule rather than CASCADE closure. `own` always has exactly one
            # table here; row_count excludes the one preserved row.
            (table,) = own
            extra = ()
            row_count = max(table_row_count(db, table) - 1, 0)
        out.append(DomainInfo(domain=domain, row_count=row_count, extra_tables=extra))
    return out


def _validate_confirmation(*, expected_phrase: str, confirm_phrase: str, current_user: User, password: str) -> None:
    if confirm_phrase.strip() != expected_phrase:
        raise DataResetError("La frase de confirmación no coincide.")
    if not verify_password(password, current_user.password_hash):
        raise DataResetError("Contraseña incorrecta.")


def _truncate(db: Session, tables: set[str]) -> None:
    if not tables:
        return
    quoted = ", ".join(_quote(t) for t in sorted(tables))
    db.execute(text(f"TRUNCATE {quoted} RESTART IDENTITY CASCADE"))


def _delete_organizations_except(db: Session, keep_org_id: int | None) -> int:
    # `keep_org_id` should never actually be None here — the router already
    # confirmed the caller is a super admin, which means they necessarily
    # have exactly this organization/membership/role chain. But if it ever
    # were None, deleting unconditionally would wipe *every* organization,
    # including the acting admin's own — so refuse instead of guessing.
    if keep_org_id is None:
        raise DataResetError(
            "No se pudo determinar tu organización de super admin; abortado por seguridad sin borrar nada."
        )
    result = db.execute(text("DELETE FROM organizations WHERE id != :keep"), {"keep": keep_org_id})
    return result.rowcount or 0


def _delete_users_except(db: Session, keep_user_id: int) -> int:
    result = db.execute(text("DELETE FROM users WHERE id != :keep"), {"keep": keep_user_id})
    return result.rowcount or 0


def reset_domain(
    db: Session,
    *,
    current_user: User,
    domain_key: str,
    confirm_phrase: str,
    password: str,
) -> ResetResult:
    domain = DATA_DOMAINS_BY_KEY.get(domain_key)
    if domain is None:
        raise DataResetError(f"Dominio desconocido: {domain_key!r}")

    _validate_confirmation(
        expected_phrase=domain.confirm_phrase,
        confirm_phrase=confirm_phrase,
        current_user=current_user,
        password=password,
    )

    preserved_org_id = get_super_admin_org_id(db, current_user)

    try:
        if domain.special is None:
            own = set(domain.tables)
            closure = compute_cascade_closure(db, own) - PROTECTED_TABLES
            rows_before = sum(table_row_count(db, t) for t in closure)
            _truncate(db, closure)
            tables_wiped = tuple(sorted(closure))
            rows_deleted = rows_before
        elif domain.special == "preserve_super_admin_org":
            rows_deleted = _delete_organizations_except(db, preserved_org_id)
            tables_wiped = ("organizations",)
        elif domain.special == "preserve_super_admin_user":
            rows_deleted = _delete_users_except(db, current_user.id)
            tables_wiped = ("users",)
        else:  # pragma: no cover — defensive, registry-controlled
            raise DataResetError(f"Tipo de dominio no soportado: {domain.special!r}")

        db.commit()
    except Exception:
        db.rollback()
        raise

    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="admin_data_reset.domain",
        entity_type="platform",
        entity_id=domain.key,
        metadata={"tables_wiped": list(tables_wiped), "rows_deleted": rows_deleted},
    )

    return ResetResult(
        tables_wiped=tables_wiped,
        rows_deleted=rows_deleted,
        preserved_user_email=current_user.email,
        preserved_org_id=preserved_org_id,
    )


def reset_all(
    db: Session,
    *,
    current_user: User,
    confirm_phrase: str,
    password: str,
) -> ResetResult:
    _validate_confirmation(
        expected_phrase=MASTER_CONFIRM_PHRASE,
        confirm_phrase=confirm_phrase,
        current_user=current_user,
        password=password,
    )

    preserved_org_id = get_super_admin_org_id(db, current_user)

    try:
        # 1) Wipe every plain data table first (products, catalog, courses,
        #    blog, purchases, requests, logs, ...) — this must happen before
        #    step 2, because several of these tables reference organizations
        #    via a FK, and the non-preserved organizations get removed with a
        #    real per-row DELETE (not TRUNCATE) in step 2, which does respect
        #    each FK's ondelete rule.
        plain_tables: set[str] = set()
        for domain in PLAIN_DOMAINS:
            plain_tables |= set(domain.tables)
        closure = compute_cascade_closure(db, plain_tables) - PROTECTED_TABLES
        rows_deleted = sum(table_row_count(db, t) for t in closure)
        _truncate(db, closure)

        # 2) Remove every organization except the acting super admin's own —
        #    cascades away its members/role-assignments via each table's own
        #    ON DELETE rule.
        rows_deleted += _delete_organizations_except(db, preserved_org_id)

        # 3) Remove every user except the acting super admin. By now the
        #    only organization left is theirs, so the RESTRICT constraint on
        #    organizations.owner_user_id can no longer block this delete.
        rows_deleted += _delete_users_except(db, current_user.id)

        db.commit()
    except Exception:
        db.rollback()
        raise

    tables_wiped = tuple(sorted(closure | {"organizations", "users"}))

    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="admin_data_reset.all",
        entity_type="platform",
        entity_id="__all__",
        metadata={"tables_wiped": list(tables_wiped), "rows_deleted": rows_deleted},
    )

    return ResetResult(
        tables_wiped=tables_wiped,
        rows_deleted=rows_deleted,
        preserved_user_email=current_user.email,
        preserved_org_id=preserved_org_id,
    )
