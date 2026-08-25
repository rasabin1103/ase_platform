from __future__ import annotations

import io
import re
import zipfile
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import github_client
from app.core.api_credentials import generate_client_id, generate_client_secret, hash_client_secret
from app.core.config import settings
from app.core.secret_encryption import DecryptionError, decrypt_value, encrypt_value
from app.models.api_credential import ApiCredential
from app.models.catalog_item import CatalogItem
from app.models.enums import ApiCredentialStatus, TestRunStatus
from app.models.test_execution_config import TestExecutionConfig
from app.models.test_run import TestRun
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

# GitHub Actions' own run.status values, mapped onto our TestRunStatus —
# kept as a dict rather than reusing the string directly so a GitHub API
# vocabulary change doesn't silently produce an invalid enum value; anything
# unrecognized just leaves the row's current status untouched.
_GITHUB_STATUS_MAP: dict[str, TestRunStatus] = {
    "queued": TestRunStatus.queued,
    "in_progress": TestRunStatus.in_progress,
    "completed": TestRunStatus.completed,
}

# Best-effort scrape of a pass/fail/skip/error breakdown out of whatever
# HTML report the workflow uploaded. pytest-html (and most reports that
# just wrap pytest's own terminal summary) reliably render a phrase like
# "12 passed, 1 failed, 2 skipped" somewhere on the page, but the exact
# markup varies a lot by tool/version — matching on that plain-text phrase
# rather than any particular DOM structure is what survives across them.
# A tool this doesn't recognize just means the ASE report renders without
# a test-level breakdown; the job/step timeline (from GitHub's own API,
# not this scrape) always still renders regardless.
_TEST_SUMMARY_PATTERNS: dict[str, re.Pattern[str]] = {
    "passed": re.compile(r"(\d+)\s+passed", re.IGNORECASE),
    "failed": re.compile(r"(\d+)\s+failed", re.IGNORECASE),
    "skipped": re.compile(r"(\d+)\s+skipped", re.IGNORECASE),
    "error": re.compile(r"(\d+)\s+error", re.IGNORECASE),
}


def _extract_test_summary(html: str) -> dict[str, int] | None:
    found: dict[str, int] = {}
    for key, pattern in _TEST_SUMMARY_PATTERNS.items():
        match = pattern.search(html)
        if match:
            found[key] = int(match.group(1))
    return found or None


class TestExecutionError(Exception):
    """Base for every error this service raises — the router maps each
    subclass to a specific HTTP status."""


class CredentialNotFoundError(TestExecutionError):
    pass


class FrameworkNotRunnableError(TestExecutionError):
    """Raised when the slug either doesn't exist or exists but has no
    test_workflow_file configured — both cases surface identically to the
    caller (a slug that only ever existed as a course/book, say, should not
    leak whether the "products" slug even exists)."""


class NotEntitledError(TestExecutionError):
    """The caller doesn't own this framework (no permanent purchase and no
    live plan entitlement)."""


class QuotaExceededError(TestExecutionError):
    def __init__(self, *, included_runs: int, used_runs: int):
        super().__init__(f"Run quota exhausted ({used_runs}/{included_runs} used)")
        self.included_runs = included_runs
        self.used_runs = used_runs


class RunNotFoundError(TestExecutionError):
    pass


class ReportNotFoundError(TestExecutionError):
    """No usable HTML report could be produced for this run — no
    github_run_id yet, the run has no artifacts, its only artifact expired
    (GitHub's default retention is 90 days), or the artifact's zip contains
    no .html/.htm file. Every one of these collapses to the same 404 from
    the caller's point of view — there's nothing actionable to tell a buyer
    beyond "not available"."""


class MissingVariablesError(TestExecutionError):
    """Raised when dispatching a run would leave one or more of the
    framework's required workflow_dispatch inputs unset — neither the
    caller's saved TestExecutionConfig nor any inline `variables` supplied
    it. Raised before ever calling out to GitHub, so a misconfigured buyer
    never burns a quota'd run on a dispatch that GitHub would reject anyway
    (see github_client.dispatch_workflow's 422 case, which this pre-empts)."""

    def __init__(self, missing_keys: list[str]):
        super().__init__(f"Missing required variables: {', '.join(missing_keys)}")
        self.missing_keys = missing_keys


class ScenarioNotFoundError(TestExecutionError):
    """The referenced scenario (TestExecutionConfig) doesn't exist, or
    exists but belongs to a different user."""


class DuplicateScenarioNameError(TestExecutionError):
    """Raised on create/rename when another scenario for the same (user,
    framework) already has that name (case-insensitive, trimmed) — scenario
    names are how a buyer tells two saved variable sets apart, so silently
    allowing duplicates would defeat the point."""

    def __init__(self, name: str):
        super().__init__(f"A scenario named '{name}' already exists for this framework")
        self.name = name


class TestExecutionService:
    def __init__(self, db: Session):
        self.db = db
        self.purchases = CatalogPurchasesRepository(db)

    # --- Credential management (private, JWT-authenticated) ----------------

    def create_credential(self, *, user_id: int, name: str) -> tuple[ApiCredential, str]:
        raw_secret = generate_client_secret()
        credential = ApiCredential(
            user_id=user_id,
            name=name.strip(),
            client_id=generate_client_id(),
            client_secret_hash=hash_client_secret(raw_secret),
            status=ApiCredentialStatus.active,
        )
        self.db.add(credential)
        self.db.commit()
        self.db.refresh(credential)
        return credential, raw_secret

    def list_credentials(self, *, user_id: int) -> list[ApiCredential]:
        stmt = (
            select(ApiCredential)
            .where(ApiCredential.user_id == user_id)
            .order_by(ApiCredential.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def _get_own_credential(self, *, user_id: int, credential_uuid: UUID) -> ApiCredential:
        stmt = select(ApiCredential).where(
            ApiCredential.uuid == credential_uuid, ApiCredential.user_id == user_id,
        )
        credential = self.db.execute(stmt).scalar_one_or_none()
        if credential is None:
            raise CredentialNotFoundError()
        return credential

    def rename_credential(self, *, user_id: int, credential_uuid: UUID, name: str) -> ApiCredential:
        credential = self._get_own_credential(user_id=user_id, credential_uuid=credential_uuid)
        credential.name = name.strip()
        self.db.commit()
        self.db.refresh(credential)
        return credential

    def revoke_credential(self, *, user_id: int, credential_uuid: UUID) -> None:
        """"Delete" from the user's point of view: the credential
        immediately stops authenticating (get_current_api_credential checks
        status == active) and disappears from the active list. The row
        itself stays so past TestRun rows keep a resolvable owner — see
        ApiCredential's docstring."""
        credential = self._get_own_credential(user_id=user_id, credential_uuid=credential_uuid)
        if credential.status == ApiCredentialStatus.active:
            credential.status = ApiCredentialStatus.revoked
            credential.revoked_at = datetime.now(timezone.utc)
            self.db.commit()

    # --- Frameworks + quota (private) ---------------------------------------

    @staticmethod
    def _is_free(item: CatalogItem) -> bool:
        return item.price is None or item.price <= 0

    def _owns_item(self, item: CatalogItem, *, user_id: int, owned_slugs: set[str] | None = None) -> bool:
        """Same rule as ConsumerCatalogService._owns_resource: a free item
        (price 0) needs no purchase/plan row at all, exactly like every
        other pillar's free-claim behavior — a framework product priced at
        0 is runnable by anyone the moment it's published. `owned_slugs`
        lets a caller that already fetched the set once (e.g.
        list_runnable_frameworks, checking many items) skip refetching it
        per item."""
        if self._is_free(item):
            return True
        slugs = owned_slugs if owned_slugs is not None else self.purchases.slugs_for_user(user_id)
        return item.slug in slugs

    def _used_runs(self, *, user_id: int, catalog_item_id: int) -> int:
        stmt = select(func.count()).select_from(TestRun).where(
            TestRun.user_id == user_id,
            TestRun.catalog_item_id == catalog_item_id,
            # A dispatch that never reached GitHub doesn't cost the customer
            # a run — see TestExecutionError docstrings / TestRun model.
            TestRun.status != TestRunStatus.failed_to_dispatch,
        )
        return int(self.db.execute(stmt).scalar_one())

    def list_runnable_frameworks(self, *, user_id: int) -> list[dict]:
        # Every product with a workflow configured is a candidate — free
        # ones (price 0) are runnable without any purchase row, same as the
        # rest of the catalog's free-claim behavior, so this can't be
        # pre-filtered by `slug IN owned_slugs` the way a purchase-only
        # check could.
        owned_slugs = self.purchases.slugs_for_user(user_id)
        stmt = select(CatalogItem).where(CatalogItem.test_workflow_file.isnot(None))
        items = list(self.db.execute(stmt).scalars().all())
        result = []
        for item in items:
            if not self._owns_item(item, user_id=user_id, owned_slugs=owned_slugs):
                continue
            included = item.test_included_runs or 0
            used = self._used_runs(user_id=user_id, catalog_item_id=item.id)
            result.append(
                {
                    "slug": item.slug,
                    "title": item.title,
                    "includedRuns": included,
                    "usedRuns": used,
                    "remainingRuns": max(0, included - used),
                    "inputSchema": item.test_input_schema_json or [],
                }
            )
        return result

    # --- Buyer-configured variables (private, JWT) --------------------------
    # Lets each buyer save several named "scenarios" of workflow_dispatch
    # input values for the framework (e.g. "Staging", "Production creds")
    # against the admin-defined test_input_schema_json — persisted encrypted
    # at rest (see app.core.secret_encryption) and decrypted only right
    # before dispatch. Exactly one scenario per (user, item) is flagged
    # is_default at any time; a trigger call that doesn't name a scenario
    # explicitly always resolves against that one.

    @staticmethod
    def _input_schema(item: CatalogItem) -> list[dict]:
        return item.test_input_schema_json or []

    def _list_own_scenarios(self, *, user_id: int, catalog_item_id: int) -> list[TestExecutionConfig]:
        stmt = (
            select(TestExecutionConfig)
            .where(TestExecutionConfig.user_id == user_id, TestExecutionConfig.catalog_item_id == catalog_item_id)
            .order_by(TestExecutionConfig.is_default.desc(), TestExecutionConfig.created_at.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def _get_own_scenario(self, *, user_id: int, catalog_item_id: int, config_uuid: UUID) -> TestExecutionConfig:
        stmt = select(TestExecutionConfig).where(
            TestExecutionConfig.uuid == config_uuid,
            TestExecutionConfig.user_id == user_id,
            TestExecutionConfig.catalog_item_id == catalog_item_id,
        )
        scenario = self.db.execute(stmt).scalar_one_or_none()
        if scenario is None:
            raise ScenarioNotFoundError()
        return scenario

    def _get_default_scenario(self, *, user_id: int, catalog_item_id: int) -> TestExecutionConfig | None:
        stmt = select(TestExecutionConfig).where(
            TestExecutionConfig.user_id == user_id,
            TestExecutionConfig.catalog_item_id == catalog_item_id,
            TestExecutionConfig.is_default.is_(True),
        )
        return self.db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def _normalize_name(name: str) -> str:
        return name.strip()

    def _assert_name_available(
        self, *, user_id: int, catalog_item_id: int, name: str, exclude_id: int | None = None,
    ) -> None:
        normalized = self._normalize_name(name).lower()
        for scenario in self._list_own_scenarios(user_id=user_id, catalog_item_id=catalog_item_id):
            if scenario.id == exclude_id:
                continue
            if scenario.name.strip().lower() == normalized:
                raise DuplicateScenarioNameError(name)

    def _scenario_values(self, *, item: CatalogItem, scenario: TestExecutionConfig | None) -> list[dict]:
        stored = scenario.values_json if scenario is not None else {}
        result = []
        for field in self._input_schema(item):
            key = field.get("key", "")
            ciphertext = stored.get(key)
            has_value = ciphertext is not None
            value: str | None = None
            if has_value and field.get("type") != "secret":
                try:
                    value = decrypt_value(ciphertext)
                except DecryptionError:
                    # Key rotation or corruption — treat as unset rather than
                    # raising, so the "Configurar" form still opens and the
                    # buyer can just re-enter the value.
                    has_value = False
            result.append(
                {
                    "key": key,
                    "label": field.get("label", key),
                    "type": field.get("type", "text"),
                    "required": bool(field.get("required", False)),
                    "description": field.get("description"),
                    "hasValue": has_value,
                    "value": value,
                }
            )
        return result

    @staticmethod
    def _scenario_summary(scenario: TestExecutionConfig) -> dict:
        return {
            "uuid": scenario.uuid,
            "name": scenario.name,
            "isDefault": scenario.is_default,
            "updatedAt": scenario.updated_at,
        }

    def list_scenarios(self, *, user_id: int, slug: str) -> list[dict]:
        item = self._get_runnable_item(slug)
        return [self._scenario_summary(s) for s in self._list_own_scenarios(user_id=user_id, catalog_item_id=item.id)]

    def get_scenario(self, *, user_id: int, slug: str, config_uuid: UUID) -> tuple[dict, list[dict]]:
        item = self._get_runnable_item(slug)
        scenario = self._get_own_scenario(user_id=user_id, catalog_item_id=item.id, config_uuid=config_uuid)
        return self._scenario_summary(scenario), self._scenario_values(item=item, scenario=scenario)

    def create_scenario(
        self, *, user_id: int, slug: str, name: str, values: dict[str, str],
    ) -> tuple[dict, list[dict]]:
        item = self._get_runnable_item(slug)
        clean_name = self._normalize_name(name) or "Escenario"
        self._assert_name_available(user_id=user_id, catalog_item_id=item.id, name=clean_name)

        schema_keys = {f.get("key", "") for f in self._input_schema(item)}
        encrypted = {
            key: encrypt_value(raw_value)
            for key, raw_value in values.items()
            if key in schema_keys and raw_value != ""
        }
        # The very first scenario for this (user, item) is always the
        # default — there's nothing else it could conflict with, and a
        # buyer who's never used scenarios before shouldn't have to
        # separately mark their one-and-only config as "default" just to
        # keep triggering runs the way they always could.
        is_first = not self._list_own_scenarios(user_id=user_id, catalog_item_id=item.id)
        scenario = TestExecutionConfig(
            user_id=user_id, catalog_item_id=item.id, name=clean_name, values_json=encrypted, is_default=is_first,
        )
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        return self._scenario_summary(scenario), self._scenario_values(item=item, scenario=scenario)

    def update_scenario(
        self,
        *,
        user_id: int,
        slug: str,
        config_uuid: UUID,
        name: str | None = None,
        values: dict[str, str] | None = None,
    ) -> tuple[dict, list[dict]]:
        item = self._get_runnable_item(slug)
        scenario = self._get_own_scenario(user_id=user_id, catalog_item_id=item.id, config_uuid=config_uuid)

        if name is not None:
            clean_name = self._normalize_name(name) or scenario.name
            self._assert_name_available(
                user_id=user_id, catalog_item_id=item.id, name=clean_name, exclude_id=scenario.id,
            )
            scenario.name = clean_name

        if values is not None:
            schema_keys = {f.get("key", "") for f in self._input_schema(item)}
            stored = dict(scenario.values_json or {})
            for key, raw_value in values.items():
                if key not in schema_keys:
                    continue  # ignore stray keys not declared on this framework's schema
                if raw_value == "":
                    stored.pop(key, None)  # empty string clears/unsets
                else:
                    stored[key] = encrypt_value(raw_value)
            scenario.values_json = stored

        self.db.commit()
        self.db.refresh(scenario)
        return self._scenario_summary(scenario), self._scenario_values(item=item, scenario=scenario)

    def set_default_scenario(self, *, user_id: int, slug: str, config_uuid: UUID) -> dict:
        item = self._get_runnable_item(slug)
        target = self._get_own_scenario(user_id=user_id, catalog_item_id=item.id, config_uuid=config_uuid)
        for scenario in self._list_own_scenarios(user_id=user_id, catalog_item_id=item.id):
            scenario.is_default = scenario.id == target.id
        self.db.commit()
        self.db.refresh(target)
        return self._scenario_summary(target)

    def delete_scenario(self, *, user_id: int, slug: str, config_uuid: UUID) -> None:
        item = self._get_runnable_item(slug)
        scenario = self._get_own_scenario(user_id=user_id, catalog_item_id=item.id, config_uuid=config_uuid)
        was_default = scenario.is_default
        self.db.delete(scenario)
        self.db.flush()
        if was_default:
            # Promote whichever scenario was created earliest among the
            # ones left, so there's always a default to fall back to as
            # long as at least one scenario still exists — the trigger
            # flow assumes "no explicit scenario chosen" means "use the
            # default", not "error out".
            remaining = self._list_own_scenarios(user_id=user_id, catalog_item_id=item.id)
            if remaining:
                remaining[0].is_default = True
        self.db.commit()

    def _resolve_variables(
        self, *, item: CatalogItem, user_id: int, inline: dict[str, str] | None, config_uuid: UUID | None = None,
    ) -> tuple[dict[str, str], TestExecutionConfig | None]:
        """Merges the caller's chosen scenario (decrypted) with any inline
        `variables` for this one call — inline wins per-key. `config_uuid`
        picks a specific scenario explicitly; omitted, it falls back to
        whichever scenario is flagged is_default (or no saved scenario at
        all, if the buyer never created one). Raises MissingVariablesError
        if any schema-required key ends up unset in the union, before ever
        calling out to GitHub. Returns the resolved values plus whichever
        TestExecutionConfig row (if any) they came from, so the caller can
        record it on the created TestRun."""
        schema = self._input_schema(item)

        scenario: TestExecutionConfig | None = None
        if config_uuid is not None:
            scenario = self._get_own_scenario(user_id=user_id, catalog_item_id=item.id, config_uuid=config_uuid)
        else:
            scenario = self._get_default_scenario(user_id=user_id, catalog_item_id=item.id)

        if not schema:
            return dict(inline or {}), scenario

        stored = scenario.values_json if scenario is not None else {}
        resolved: dict[str, str] = {}
        for field in schema:
            key = field.get("key", "")
            if inline and key in inline and inline[key] != "":
                resolved[key] = inline[key]
                continue
            ciphertext = stored.get(key)
            if ciphertext is not None:
                try:
                    resolved[key] = decrypt_value(ciphertext)
                except DecryptionError:
                    continue

        missing = [
            f.get("key", "") for f in schema
            if f.get("required") and not resolved.get(f.get("key", ""))
        ]
        if missing:
            raise MissingVariablesError(missing)
        return resolved, scenario

    # --- Run triggering + status (public, Basic Auth + private dashboard) ---

    def _get_runnable_item(self, slug: str) -> CatalogItem:
        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == slug)).scalar_one_or_none()
        if item is None or not item.test_workflow_file or not item.test_repo_url:
            raise FrameworkNotRunnableError()
        return item

    def trigger_run(
        self,
        *,
        user_id: int,
        slug: str,
        credential_id: int | None = None,
        ref: str | None = None,
        variables: dict[str, str] | None = None,
        config_uuid: UUID | None = None,
    ) -> TestRun:
        """`credential_id=None` means this is a private dashboard trigger
        ("Probar ahora") rather than a public client_id/client_secret API
        call — see TestRun.api_credential_id's docstring. Both paths share
        the same quota, entitlement check, and variable resolution.
        `config_uuid` picks a specific saved scenario; omitted, the
        scenario flagged is_default is used (see _resolve_variables)."""
        item = self._get_runnable_item(slug)

        if not self._owns_item(item, user_id=user_id):
            raise NotEntitledError()

        included = item.test_included_runs or 0
        used = self._used_runs(user_id=user_id, catalog_item_id=item.id)
        if used >= included:
            raise QuotaExceededError(included_runs=included, used_runs=used)

        resolved_variables, scenario = self._resolve_variables(
            item=item, user_id=user_id, inline=variables, config_uuid=config_uuid,
        )

        run = TestRun(
            catalog_item_id=item.id,
            api_credential_id=credential_id,
            user_id=user_id,
            status=TestRunStatus.pending,
            test_execution_config_id=scenario.id if scenario is not None else None,
        )
        self.db.add(run)
        self.db.flush()  # assigns id/uuid before we call out to GitHub

        dispatched_at = datetime.now(timezone.utc)
        token = settings.GITHUB_ACCESS_TOKEN or ""
        try:
            github_client.dispatch_workflow(
                repo_url=item.test_repo_url,
                workflow_file=item.test_workflow_file,
                token=token,
                ref=ref or "main",
                inputs=resolved_variables,
            )
        except github_client.GithubWorkflowError as exc:
            run.status = TestRunStatus.failed_to_dispatch
            run.error_message = str(exc)
            self.db.commit()
            self.db.refresh(run)
            return run

        run.status = TestRunStatus.queued
        # Best-effort immediate lookup so the response can carry a report
        # link right away when GitHub is fast enough; if it's not found yet
        # the polling job (see app.main scheduler) fills it in shortly after.
        try:
            found = github_client.find_latest_dispatched_run(
                repo_url=item.test_repo_url,
                workflow_file=item.test_workflow_file,
                token=token,
                dispatched_after=dispatched_at,
            )
        except github_client.GithubWorkflowError:
            found = None
        if found is not None:
            run.github_run_id = found.get("id")
            run.github_run_url = found.get("html_url")
            mapped = _GITHUB_STATUS_MAP.get(found.get("status", ""))
            if mapped is not None:
                run.status = mapped

        self.db.commit()
        self.db.refresh(run)
        return run

    def _get_own_run(self, *, user_id: int, run_uuid: UUID) -> TestRun:
        stmt = select(TestRun).where(TestRun.uuid == run_uuid, TestRun.user_id == user_id)
        run = self.db.execute(stmt).scalar_one_or_none()
        if run is None:
            raise RunNotFoundError()
        return run

    def get_run(self, *, user_id: int, run_uuid: UUID) -> TestRun:
        return self._get_own_run(user_id=user_id, run_uuid=run_uuid)

    def get_run_report_html(self, *, user_id: int, run_uuid: UUID) -> str:
        """Fetches the run's uploaded HTML report (e.g. pytest-html's
        --self-contained-html output) by listing its GitHub Actions
        artifacts, downloading whichever one looks like a report (or the
        first non-expired one), and extracting the single HTML file from
        inside its zip. Proxied entirely through the server's own token —
        the buyer never gets a GitHub URL or GitHub access, only these
        bytes."""
        run = self._get_own_run(user_id=user_id, run_uuid=run_uuid)
        if run.github_run_id is None:
            raise ReportNotFoundError()
        item = self.db.get(CatalogItem, run.catalog_item_id)
        if item is None or not item.test_repo_url:
            raise ReportNotFoundError()

        token = settings.GITHUB_ACCESS_TOKEN or ""
        try:
            artifacts = github_client.list_workflow_run_artifacts(
                repo_url=item.test_repo_url, token=token, run_id=run.github_run_id,
            )
        except github_client.GithubWorkflowError:
            raise ReportNotFoundError()

        candidates = [a for a in artifacts if not a.get("expired")]
        if not candidates:
            raise ReportNotFoundError()
        artifact = next(
            (a for a in candidates if "report" in str(a.get("name", "")).lower()), candidates[0],
        )

        try:
            zip_bytes = github_client.download_artifact_zip(
                repo_url=item.test_repo_url, token=token, artifact_id=artifact["id"],
            )
        except github_client.GithubWorkflowError:
            raise ReportNotFoundError()

        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                html_names = [n for n in zf.namelist() if n.lower().endswith((".html", ".htm"))]
                if not html_names:
                    raise ReportNotFoundError()
                with zf.open(html_names[0]) as f:
                    return f.read().decode("utf-8", errors="replace")
        except zipfile.BadZipFile:
            raise ReportNotFoundError()

    # Raw job logs can run long for a big test suite — this is a display
    # cap, not a GitHub limit, so the response stays a reasonable size; the
    # tail is kept (not the head) since that's where a failure's traceback
    # and the run's final summary line live.
    _MAX_LOG_CHARS = 200_000

    def get_run_logs(self, *, user_id: int, run_uuid: UUID, job_index: int = 0) -> str:
        """Raw console output for one job of this run — GitHub's own log,
        not a report-tool artifact, so it always has *something* (command
        echoing, dependency install, pytest's own captured
        stdout/traceback on failure) regardless of what testing tool the
        framework uses. This is the "what did the service actually
        respond, or why did it fail" detail a summary/report can't show."""
        run = self._get_own_run(user_id=user_id, run_uuid=run_uuid)
        if run.github_run_id is None:
            raise ReportNotFoundError()
        item = self.db.get(CatalogItem, run.catalog_item_id)
        if item is None or not item.test_repo_url:
            raise ReportNotFoundError()

        token = settings.GITHUB_ACCESS_TOKEN or ""
        try:
            jobs = github_client.list_workflow_run_jobs(
                repo_url=item.test_repo_url, token=token, run_id=run.github_run_id,
            )
        except github_client.GithubWorkflowError:
            raise ReportNotFoundError()
        if not jobs or job_index >= len(jobs):
            raise ReportNotFoundError()
        job_id = jobs[job_index].get("id")
        if job_id is None:
            raise ReportNotFoundError()

        try:
            text = github_client.get_job_logs(repo_url=item.test_repo_url, token=token, job_id=job_id)
        except github_client.GithubWorkflowError:
            raise ReportNotFoundError()

        if len(text) > self._MAX_LOG_CHARS:
            text = "… (truncated — showing the last portion)\n" + text[-self._MAX_LOG_CHARS :]
        return text

    def get_run_summary(self, *, user_id: int, run_uuid: UUID) -> dict:
        """Structured data behind the ASE-branded report — built from
        GitHub's own Jobs API (reliable, always available once a runner has
        picked up the run) plus a best-effort scrape of the uploaded
        artifact for a pass/fail/skip/error breakdown. Never raises for "no
        report yet" the way get_run_report_html does — an in-progress or
        even a failed-to-dispatch run still has a summary worth showing,
        just with empty jobs/testSummary."""
        run = self._get_own_run(user_id=user_id, run_uuid=run_uuid)
        item = self.db.get(CatalogItem, run.catalog_item_id)

        jobs: list[dict] = []
        if run.github_run_id is not None and item is not None and item.test_repo_url:
            token = settings.GITHUB_ACCESS_TOKEN or ""
            try:
                raw_jobs = github_client.list_workflow_run_jobs(
                    repo_url=item.test_repo_url, token=token, run_id=run.github_run_id,
                )
            except github_client.GithubWorkflowError:
                raw_jobs = []
            jobs = [
                {
                    "name": j.get("name", ""),
                    "status": j.get("status"),
                    "conclusion": j.get("conclusion"),
                    "startedAt": j.get("started_at"),
                    "completedAt": j.get("completed_at"),
                    "steps": [
                        {
                            "name": s.get("name", ""),
                            "status": s.get("status"),
                            "conclusion": s.get("conclusion"),
                            "startedAt": s.get("started_at"),
                            "completedAt": s.get("completed_at"),
                        }
                        for s in j.get("steps", [])
                    ],
                }
                for j in raw_jobs
            ]

        html_report: str | None = None
        try:
            html_report = self.get_run_report_html(user_id=user_id, run_uuid=run_uuid)
        except ReportNotFoundError:
            html_report = None
        test_summary = _extract_test_summary(html_report) if html_report else None

        duration_seconds: int | None = None
        if run.started_at is not None:
            end = run.completed_at or datetime.now(timezone.utc)
            duration_seconds = max(0, int((end - run.started_at).total_seconds()))

        return {
            "runUuid": run.uuid,
            "frameworkTitle": item.title if item is not None else "",
            "status": run.status,
            "conclusion": run.conclusion,
            "progressPercent": run.progress_percent,
            "createdAt": run.created_at,
            "startedAt": run.started_at,
            "completedAt": run.completed_at,
            "durationSeconds": duration_seconds,
            "githubRunUrl": run.github_run_url,
            "errorMessage": run.error_message,
            "testSummary": test_summary,
            "jobs": jobs,
            "originalReportAvailable": html_report is not None,
        }

    def list_runs(
        self, *, user_id: int, slug: str | None = None, limit: int = 20, offset: int = 0,
    ) -> tuple[list[TestRun], int]:
        stmt = select(TestRun).where(TestRun.user_id == user_id, TestRun.hidden_at.is_(None))
        count_stmt = select(func.count()).select_from(TestRun).where(
            TestRun.user_id == user_id, TestRun.hidden_at.is_(None),
        )
        if slug is not None:
            item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == slug)).scalar_one_or_none()
            item_id = item.id if item is not None else -1
            stmt = stmt.where(TestRun.catalog_item_id == item_id)
            count_stmt = count_stmt.where(TestRun.catalog_item_id == item_id)
        total = int(self.db.execute(count_stmt).scalar_one())
        stmt = stmt.order_by(TestRun.created_at.desc()).limit(limit).offset(offset)
        runs = list(self.db.execute(stmt).scalars().all())
        return runs, total

    def hide_run(self, *, user_id: int, run_uuid: UUID) -> None:
        """Removes a run from the user's own /test-execution history —
        never a real delete (see TestRun.hidden_at's docstring), so their
        run quota is unaffected either way."""
        run = self._get_own_run(user_id=user_id, run_uuid=run_uuid)
        if run.hidden_at is None:
            run.hidden_at = datetime.now(timezone.utc)
            self.db.commit()

    def slug_for_run(self, run: TestRun) -> str:
        item = self.db.get(CatalogItem, run.catalog_item_id)
        return item.slug if item is not None else ""
