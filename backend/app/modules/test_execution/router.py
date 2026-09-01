from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.api_credential import ApiCredential
from app.models.test_run import TestRun
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.test_execution.dependencies import get_current_api_credential, get_current_api_user
from app.modules.test_execution.schemas import (
    AdminApproveRefRequest,
    AdminApproveRefResponse,
    AdminResetQuotaRequest,
    AdminResetQuotaResponse,
    AdminRevokeRefRequest,
    ApiCredentialCreateRequest,
    ApiCredentialCreateResponse,
    ApiCredentialRead,
    ApiCredentialUpdateRequest,
    ApprovedRefRead,
    PrivateTestRunTriggerRequest,
    RunnableFrameworkRead,
    TestExecutionConfigValueRead,
    TestRunListResponse,
    TestRunRead,
    TestRunSummaryRead,
    TestRunTriggerRequest,
    TestScenarioCreateRequest,
    TestScenarioListResponse,
    TestScenarioRead,
    TestScenarioSummaryRead,
    TestScenarioUpdateRequest,
)
from app.modules.test_execution.service import (
    ApprovedRefNotFoundError,
    CredentialNotFoundError,
    DuplicateScenarioNameError,
    FrameworkNotRunnableError,
    MissingVariablesError,
    NotEntitledError,
    QuotaExceededError,
    RefNotApprovedError,
    ReportNotFoundError,
    RunNotFoundError,
    ScenarioNotFoundError,
    TestExecutionService,
    UserNotFoundError,
)

# --- Private router: credential management + own run history, JWT-authenticated ---
router = APIRouter(prefix="/api/v1/test-execution", tags=["test-execution"])

# --- Public router: run triggering + status, HTTP Basic client_id/client_secret ---
public_router = APIRouter(prefix="/api/v1/public/test-execution", tags=["test-execution-api"])

# --- Admin router: support/ops actions on a specific buyer's quota. Reuses
# "catalog.manage" rather than a dedicated permission code — same rationale
# as catalog_categories/booking/blog_admin/pricing_admin: this is a small
# adjacent surface to catalog administration, not a standalone module that
# warrants its own RBAC entry.
admin_router = APIRouter(prefix="/api/v1/admin/test-execution", tags=["test-execution-admin"])


def get_service(db: Session = Depends(get_db)) -> TestExecutionService:
    return TestExecutionService(db)


def _credential_to_read(credential: ApiCredential) -> ApiCredentialRead:
    return ApiCredentialRead(
        uuid=credential.uuid,
        name=credential.name,
        clientId=credential.client_id,
        status=credential.status.value,
        lastUsedAt=credential.last_used_at,
        createdAt=credential.created_at,
        revokedAt=credential.revoked_at,
    )


def _run_to_read(run: TestRun, *, slug: str) -> TestRunRead:
    return TestRunRead(
        uuid=run.uuid,
        catalogItemSlug=slug,
        status=run.status,
        conclusion=run.conclusion,
        githubRunUrl=run.github_run_url,
        errorMessage=run.error_message,
        progressPercent=run.progress_percent,
        startedAt=run.started_at,
        completedAt=run.completed_at,
        createdAt=run.created_at,
    )


# ---------------------------------------------------------------------------
# Private: credential CRUD (mirrors /consumer-catalog/me/state — an
# own-resource endpoint gated by login alone, no extra RBAC permission).
# ---------------------------------------------------------------------------


@router.post("/credentials", response_model=ApiCredentialCreateResponse, status_code=status.HTTP_201_CREATED)
def create_credential(
    payload: ApiCredentialCreateRequest,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    credential, raw_secret = svc.create_credential(user_id=user.id, name=payload.name)
    return ApiCredentialCreateResponse(**_credential_to_read(credential).model_dump(), clientSecret=raw_secret)


@router.get("/credentials", response_model=list[ApiCredentialRead])
def list_credentials(user: User = Depends(get_current_user), svc: TestExecutionService = Depends(get_service)):
    return [_credential_to_read(c) for c in svc.list_credentials(user_id=user.id)]


@router.patch("/credentials/{credential_uuid}", response_model=ApiCredentialRead)
def rename_credential(
    credential_uuid: UUID,
    payload: ApiCredentialUpdateRequest,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        credential = svc.rename_credential(user_id=user.id, credential_uuid=credential_uuid, name=payload.name)
    except CredentialNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    return _credential_to_read(credential)


@router.delete("/credentials/{credential_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_credential(
    credential_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        svc.revoke_credential(user_id=user.id, credential_uuid=credential_uuid)
    except CredentialNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")


@router.get("/frameworks", response_model=list[RunnableFrameworkRead])
def list_runnable_frameworks(user: User = Depends(get_current_user), svc: TestExecutionService = Depends(get_service)):
    """Frameworks this user owns (direct purchase or live plan) that can
    actually be run, with current usage against each one's quota — powers
    the private dashboard so the customer can see remaining runs before
    wiring up their CI."""
    return svc.list_runnable_frameworks(user_id=user.id)


def _scenario_to_read(summary: dict, values: list[dict]) -> TestScenarioRead:
    return TestScenarioRead(
        **summary, values=[TestExecutionConfigValueRead(**v) for v in values],
    )


@router.get("/frameworks/{slug}/scenarios", response_model=TestScenarioListResponse)
def list_framework_scenarios(
    slug: str,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Every saved scenario (named set of variable values) this buyer has
    for this framework — powers the scenario picker. Empty until they save
    their first one."""
    try:
        scenarios = svc.list_scenarios(user_id=user.id, slug=slug)
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    return TestScenarioListResponse(items=[TestScenarioSummaryRead(**s) for s in scenarios])


@router.get("/frameworks/{slug}/scenarios/{config_uuid}", response_model=TestScenarioRead)
def get_framework_scenario(
    slug: str,
    config_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Full values for one scenario — prefills the "Configurar" form when
    editing it. Secret-typed values only ever expose `hasValue`."""
    try:
        summary, values = svc.get_scenario(user_id=user.id, slug=slug, config_uuid=config_uuid)
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return _scenario_to_read(summary, values)


@router.post(
    "/frameworks/{slug}/scenarios", response_model=TestScenarioRead, status_code=status.HTTP_201_CREATED,
)
def create_framework_scenario(
    slug: str,
    payload: TestScenarioCreateRequest,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        summary, values = svc.create_scenario(
            user_id=user.id, slug=slug, name=payload.name, values=payload.values,
        )
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except DuplicateScenarioNameError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _scenario_to_read(summary, values)


@router.put("/frameworks/{slug}/scenarios/{config_uuid}", response_model=TestScenarioRead)
def update_framework_scenario(
    slug: str,
    config_uuid: UUID,
    payload: TestScenarioUpdateRequest,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        summary, values = svc.update_scenario(
            user_id=user.id, slug=slug, config_uuid=config_uuid, name=payload.name, values=payload.values,
        )
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    except DuplicateScenarioNameError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _scenario_to_read(summary, values)


@router.post("/frameworks/{slug}/scenarios/{config_uuid}/default", response_model=TestScenarioSummaryRead)
def set_default_framework_scenario(
    slug: str,
    config_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        summary = svc.set_default_scenario(user_id=user.id, slug=slug, config_uuid=config_uuid)
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return TestScenarioSummaryRead(**summary)


@router.delete("/frameworks/{slug}/scenarios/{config_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_framework_scenario(
    slug: str,
    config_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        svc.delete_scenario(user_id=user.id, slug=slug, config_uuid=config_uuid)
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")


@router.get("/frameworks/{slug}/approved-refs", response_model=list[ApprovedRefRead])
def list_my_approved_refs(
    slug: str,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Every git ref (besides the default branch, always implicitly
    available) this buyer has been approved to run — powers the "version"
    picker (original vs. my branch) on the private dashboard."""
    try:
        refs = svc.list_approved_refs(user_id=user.id, slug=slug)
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    return [ApprovedRefRead(**r) for r in refs]


@router.post("/frameworks/{slug}/trigger", response_model=TestRunRead, status_code=status.HTTP_201_CREATED)
def trigger_run_from_dashboard(
    slug: str,
    payload: PrivateTestRunTriggerRequest,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """"Probar ahora" — triggers a run using the caller's own JWT session
    and saved TestExecutionConfig, no client_id/client_secret involved
    (TestRun.api_credential_id is left null). Counts against the same quota
    as the public API."""
    try:
        run = svc.trigger_run(
            user_id=user.id,
            slug=slug,
            ref=payload.ref,
            variables=payload.variables,
            config_uuid=payload.scenarioUuid,
        )
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except NotEntitledError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this framework")
    except RefNotApprovedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This branch/ref has not been approved for your account: {exc.ref}",
        )
    except QuotaExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Run quota exhausted: {exc.used_runs}/{exc.included_runs} runs used for this billing period",
        )
    except MissingVariablesError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required variables: {', '.join(exc.missing_keys)}",
        )
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return _run_to_read(run, slug=slug)


@router.get("/runs", response_model=TestRunListResponse)
def list_my_runs(
    slug: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    runs, total = svc.list_runs(user_id=user.id, slug=slug, limit=limit, offset=offset)
    items = [_run_to_read(r, slug=svc.slug_for_run(r)) for r in runs]
    return TestRunListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/runs/{run_uuid}", response_model=TestRunRead)
def get_my_run(
    run_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        run = svc.get_run(user_id=user.id, run_uuid=run_uuid)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return _run_to_read(run, slug=svc.slug_for_run(run))


@router.get("/runs/{run_uuid}/summary", response_model=TestRunSummaryRead)
def get_my_run_summary(
    run_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Structured data for the ASE-branded report view (see
    TestExecutionService.get_run_summary) — status, duration, GitHub
    job/step timeline, and a best-effort test count breakdown. Unlike
    /report, this never 404s just because the artifact isn't available
    yet; it renders with whatever's known so far."""
    try:
        summary = svc.get_run_summary(user_id=user.id, run_uuid=run_uuid)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return TestRunSummaryRead(**summary)


@router.get("/runs/{run_uuid}/report", response_class=HTMLResponse)
def get_my_run_report(
    run_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Proxies the run's uploaded HTML report (see
    TestExecutionService.get_run_report_html) — the buyer never touches
    GitHub directly, only this already-authenticated HTML."""
    try:
        html = svc.get_run_report_html(user_id=user.id, run_uuid=run_uuid)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    except ReportNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No report available for this run")
    return HTMLResponse(content=html)


@router.get("/runs/{run_uuid}/logs", response_class=PlainTextResponse)
def get_my_run_logs(
    run_uuid: UUID,
    job: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Raw console output for one job of the run (GitHub's own log, not a
    report-tool artifact) — the "detailed output" view, showing whatever
    the test step actually printed (service responses, tracebacks on
    failure) regardless of what testing tool the framework uses."""
    try:
        text = svc.get_run_logs(user_id=user.id, run_uuid=run_uuid, job_index=job)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    except ReportNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No logs available for this run")
    return PlainTextResponse(content=text)


@router.delete("/runs/{run_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def hide_my_run(
    run_uuid: UUID,
    user: User = Depends(get_current_user),
    svc: TestExecutionService = Depends(get_service),
):
    """Removes a run from this user's own history — never a real delete,
    see TestExecutionService.hide_run."""
    try:
        svc.hide_run(user_id=user.id, run_uuid=run_uuid)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")


# ---------------------------------------------------------------------------
# Public: the actual SaaS API, authenticated with client_id/client_secret
# (HTTP Basic) instead of a user session — this is what customers wire into
# their own CI/CD, not something a browser session ever calls.
# ---------------------------------------------------------------------------


@public_router.post("/runs", response_model=TestRunRead, status_code=status.HTTP_201_CREATED)
def trigger_run(
    payload: TestRunTriggerRequest,
    user: User = Depends(get_current_api_user),
    credential: ApiCredential = Depends(get_current_api_credential),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        run = svc.trigger_run(
            user_id=user.id,
            credential_id=credential.id,
            slug=payload.slug,
            ref=payload.ref,
            variables=payload.variables,
            config_uuid=payload.scenarioUuid,
        )
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except NotEntitledError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this framework")
    except RefNotApprovedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This branch/ref has not been approved for your account: {exc.ref}",
        )
    except QuotaExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Run quota exhausted: {exc.used_runs}/{exc.included_runs} runs used for this billing period",
        )
    except MissingVariablesError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required variables: {', '.join(exc.missing_keys)}",
        )
    except ScenarioNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return _run_to_read(run, slug=payload.slug)


@public_router.get("/runs/{run_uuid}", response_model=TestRunRead)
def get_run_status(
    run_uuid: UUID,
    user: User = Depends(get_current_api_user),
    svc: TestExecutionService = Depends(get_service),
):
    try:
        run = svc.get_run(user_id=user.id, run_uuid=run_uuid)
    except RunNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return _run_to_read(run, slug=svc.slug_for_run(run))


@public_router.get("/runs", response_model=TestRunListResponse)
def list_runs_api(
    slug: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_api_user),
    svc: TestExecutionService = Depends(get_service),
):
    runs, total = svc.list_runs(user_id=user.id, slug=slug, limit=limit, offset=offset)
    items = [_run_to_read(r, slug=svc.slug_for_run(r)) for r in runs]
    return TestRunListResponse(items=items, limit=limit, offset=offset, total=total)


# ---------------------------------------------------------------------------
# Admin: reset one buyer's run quota for one framework — e.g. for a demo
# account, or as a support courtesy. Never touches TestRun history (see
# TestQuotaReset's docstring for why a hard delete is the wrong tool here).
# ---------------------------------------------------------------------------


@admin_router.post(
    "/frameworks/{slug}/reset-quota",
    response_model=AdminResetQuotaResponse,
    dependencies=[Depends(require_permission("catalog.manage"))],
)
def admin_reset_quota(
    slug: str,
    payload: AdminResetQuotaRequest,
    svc: TestExecutionService = Depends(get_service),
):
    try:
        result = svc.reset_quota(user_email=payload.userEmail, slug=slug)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user with this email")
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    return AdminResetQuotaResponse(**result)


# ---------------------------------------------------------------------------
# Admin: approve/revoke a non-default git ref for a buyer — see
# TestApprovedRef's docstring. Lets a buyer with push access to their own
# branch (the "clone the framework, contribute on a branch" flow) run that
# branch from the dashboard only once an admin has reviewed and approved it.
# ---------------------------------------------------------------------------


@admin_router.post(
    "/frameworks/{slug}/approved-refs",
    response_model=AdminApproveRefResponse,
    dependencies=[Depends(require_permission("catalog.manage"))],
)
def admin_approve_ref(
    slug: str,
    payload: AdminApproveRefRequest,
    svc: TestExecutionService = Depends(get_service),
):
    try:
        result = svc.admin_approve_ref(
            user_email=payload.userEmail, slug=slug, ref=payload.ref, label=payload.label,
        )
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user with this email")
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    return AdminApproveRefResponse(**result)


@admin_router.delete(
    "/frameworks/{slug}/approved-refs",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("catalog.manage"))],
)
def admin_revoke_ref(
    slug: str,
    payload: AdminRevokeRefRequest,
    svc: TestExecutionService = Depends(get_service),
):
    try:
        svc.admin_revoke_ref(user_email=payload.userEmail, slug=slug, ref=payload.ref)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user with this email")
    except FrameworkNotRunnableError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No runnable framework with this slug")
    except ApprovedRefNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such approved ref for this user")
