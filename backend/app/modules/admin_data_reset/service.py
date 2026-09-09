from __future__ import annotations

import re
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


# --------------------------------------------------------------------------
# Row-level browsing/deletion (view a domain's individual rows, delete one or
# a few without wiping the whole domain). Deliberately more restrictive than
# the domain-level TRUNCATE path above: it only ever reads/deletes from a
# domain's own `tables`, never the wider FK cascade closure shown in the
# preview, and it never introspects PROTECTED_TABLES — see domains.py.
# --------------------------------------------------------------------------

# Matches column names that should never be shown in the row browser, even
# truncated/hashed — password_hash, two_factor_secret, avatar_data, etc.
_SENSITIVE_COLUMN_RE = re.compile(r"password|secret|token|hash|credential|api_key|private", re.IGNORECASE)

# Preferred, in-order pick of "the columns that make a row recognizable" —
# used because tables vary wildly in shape and there's no single natural key
# to fall back on beyond `id`. Not every table has all of these; whichever
# are present (up to _MAX_DISPLAY_COLUMNS) are shown.
_PREFERRED_DISPLAY_COLUMNS = (
    "id",
    "uuid",
    "email",
    "title",
    "name",
    "label",
    "slug",
    "key",
    "code",
    "status",
    "type",
    "created_at",
)

_MAX_DISPLAY_COLUMNS = 6
_MAX_PAGE_SIZE = 100

# Safety cap on a single backup export — this is a "download before you
# wipe it" safety net for the danger-zone UI, not a general data-export
# tool, so a pathologically large table gets a truncated-but-still-useful
# backup rather than a multi-hundred-MB response.
_MAX_EXPORT_ROWS = 20_000


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


def _table_columns(db: Session, table: str) -> list[str]:
    rows = db.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :table ORDER BY ordinal_position"
        ),
        {"table": table},
    ).scalars().all()
    return list(rows)


def _pick_display_columns(all_columns: list[str]) -> list[str]:
    safe = [c for c in all_columns if not _SENSITIVE_COLUMN_RE.search(c)]
    ordered: list[str] = []
    for name in _PREFERRED_DISPLAY_COLUMNS:
        if name in safe and name not in ordered:
            ordered.append(name)
        if len(ordered) >= _MAX_DISPLAY_COLUMNS:
            return ordered
    for name in safe:
        if name not in ordered:
            ordered.append(name)
        if len(ordered) >= _MAX_DISPLAY_COLUMNS:
            break
    return ordered


def _resolve_browsable_table(domain: DataDomain, table: str | None) -> str:
    """Row browsing/deletion is scoped to a domain's *own* tables only — never
    the wider FK cascade closure shown in the domain preview, and never
    PROTECTED_TABLES — so a super admin can't reach a table this feature
    wasn't designed to expose just by passing an arbitrary `table` param."""
    if table is None:
        return domain.tables[0]
    if table not in domain.tables:
        raise DataResetError(f"La tabla {table!r} no pertenece al dominio {domain.key!r}.")
    return table


def list_domain_table_rows(
    db: Session,
    *,
    current_user: User,
    domain_key: str,
    table: str | None,
    page: int,
    page_size: int,
) -> tuple[DataDomain, str, list[str], list[dict], int]:
    domain = DATA_DOMAINS_BY_KEY.get(domain_key)
    if domain is None:
        raise DataResetError(f"Dominio desconocido: {domain_key!r}")
    resolved_table = _resolve_browsable_table(domain, table)

    all_columns = _table_columns(db, resolved_table)
    if "id" not in all_columns:
        # Every model in this app is built on IdPkMixin (see
        # app/models/mixins.py), so this should never trigger in practice —
        # it's here so a future table that breaks that convention fails
        # loudly instead of silently browsing/deleting the wrong rows.
        raise DataResetError(f"La tabla {resolved_table!r} no tiene columna 'id'; no se puede explorar por filas.")
    display_columns = _pick_display_columns(all_columns)

    page = max(page, 1)
    page_size = min(max(page_size, 1), _MAX_PAGE_SIZE)
    offset = (page - 1) * page_size

    total = table_row_count(db, resolved_table)

    quoted_cols = ", ".join(_quote(c) for c in display_columns)
    rows_raw = db.execute(
        text(f"SELECT {quoted_cols} FROM {_quote(resolved_table)} ORDER BY id DESC LIMIT :limit OFFSET :offset"),
        {"limit": page_size, "offset": offset},
    ).mappings().all()

    # A full wipe of a special domain preserves exactly one row (the acting
    # super admin's own user/org) — mirror that here by flagging it so the UI
    # can disable its checkbox, instead of letting a row-level "select all"
    # include the one row that would break the admin's own access.
    preserved_id: int | None = None
    if domain.special == "preserve_super_admin_user":
        preserved_id = current_user.id
    elif domain.special == "preserve_super_admin_org":
        preserved_id = get_super_admin_org_id(db, current_user)

    rows: list[dict] = []
    for r in rows_raw:
        row_id = r["id"]
        rows.append(
            {
                "id": row_id,
                "columns": {c: (None if r[c] is None else str(r[c])) for c in display_columns},
                "protected": preserved_id is not None and row_id == preserved_id,
            }
        )

    return domain, resolved_table, display_columns, rows, total


def _pick_exportable_columns(all_columns: list[str]) -> list[str]:
    """Unlike _pick_display_columns (capped at a handful of "recognizable"
    columns for the on-screen table), a backup export keeps every column so
    it's an actually useful record of what's about to be deleted — the only
    thing still stripped is the same sensitive-column set the row browser
    never shows, since a downloaded file is far more likely to end up
    sitting in someone's Downloads folder than a value rendered on screen."""
    return [c for c in all_columns if not _SENSITIVE_COLUMN_RE.search(c)]


def export_domain_table_rows(
    db: Session,
    *,
    domain_key: str,
    table: str | None,
    ids: list[int] | None,
) -> tuple[str, list[str], list[dict[str, str | None]], int]:
    """Backup-before-you-delete export for the data-reset danger zone —
    either every row currently in `table` (ids=None, used before wiping a
    whole domain) or just the specific rows about to be deleted (ids
    provided, used before a row-level delete). Scoped to the domain's own
    tables the same way list_domain_table_rows/delete_rows are."""
    domain = DATA_DOMAINS_BY_KEY.get(domain_key)
    if domain is None:
        raise DataResetError(f"Dominio desconocido: {domain_key!r}")
    resolved_table = _resolve_browsable_table(domain, table)

    all_columns = _table_columns(db, resolved_table)
    if "id" not in all_columns:
        raise DataResetError(f"La tabla {resolved_table!r} no tiene columna 'id'; no se puede exportar.")
    export_columns = _pick_exportable_columns(all_columns)

    quoted_cols = ", ".join(_quote(c) for c in export_columns)
    quoted_table = _quote(resolved_table)

    if ids:
        stmt = text(
            f"SELECT {quoted_cols} FROM {quoted_table} WHERE id = ANY(:ids) ORDER BY id ASC LIMIT :limit"
        )
        params = {"ids": list(set(ids)), "limit": _MAX_EXPORT_ROWS}
    else:
        stmt = text(f"SELECT {quoted_cols} FROM {quoted_table} ORDER BY id ASC LIMIT :limit")
        params = {"limit": _MAX_EXPORT_ROWS}

    rows_raw = db.execute(stmt, params).mappings().all()
    total = table_row_count(db, resolved_table) if not ids else len(rows_raw)

    rows = [
        {c: (None if r[c] is None else str(r[c])) for c in export_columns}
        for r in rows_raw
    ]
    return resolved_table, export_columns, rows, total


def delete_rows(
    db: Session,
    *,
    current_user: User,
    domain_key: str,
    table: str,
    ids: list[int],
    password: str,
) -> int:
    domain = DATA_DOMAINS_BY_KEY.get(domain_key)
    if domain is None:
        raise DataResetError(f"Dominio desconocido: {domain_key!r}")
    resolved_table = _resolve_browsable_table(domain, table)

    if not verify_password(password, current_user.password_hash):
        raise DataResetError("Contraseña incorrecta.")

    ids_to_delete = set(ids)

    # Same invariant as the full-domain wipe above: the acting super admin
    # can never delete their own user row or their own organization's row
    # through this generic path either, no matter what the client sends.
    if domain.special == "preserve_super_admin_user" and current_user.id in ids_to_delete:
        raise DataResetError("No puedes eliminar tu propia cuenta de usuario.")
    if domain.special == "preserve_super_admin_org":
        preserved_org_id = get_super_admin_org_id(db, current_user)
        if preserved_org_id is not None and preserved_org_id in ids_to_delete:
            raise DataResetError("No puedes eliminar tu propia organización.")

    try:
        result = db.execute(
            text(f"DELETE FROM {_quote(resolved_table)} WHERE id = ANY(:ids)"),
            {"ids": list(ids_to_delete)},
        )
        rows_deleted = result.rowcount or 0
        db.commit()
    except Exception:
        db.rollback()
        raise

    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="admin_data_reset.rows",
        entity_type="platform",
        entity_id=f"{domain.key}:{resolved_table}",
        metadata={"table": resolved_table, "ids": sorted(ids_to_delete), "rows_deleted": rows_deleted},
    )
    return rows_deleted


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
