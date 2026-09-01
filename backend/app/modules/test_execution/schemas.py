from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import TestRunConclusion, TestRunStatus


class ApiCredentialCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)


class ApiCredentialUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)


class ApiCredentialRead(BaseModel):
    uuid: UUID
    name: str
    clientId: str
    status: str
    lastUsedAt: datetime | None = None
    createdAt: datetime
    revokedAt: datetime | None = None


class ApiCredentialCreateResponse(ApiCredentialRead):
    # Only ever present in the response to the creation call itself — never
    # persisted in raw form and never returned again afterward.
    clientSecret: str


class TestInputVariableRead(BaseModel):
    """One admin-declared workflow_dispatch input this framework expects —
    mirrors catalog_admin.schemas.TestInputVariableDef (kept as its own copy
    here, same pattern as TranslationStatus duplication elsewhere, so this
    module doesn't need to import from catalog_admin)."""

    key: str
    label: str
    type: str = "text"
    required: bool = False
    description: str | None = None
    options: list[str] | None = None
    default: str | None = None


class RunnableFrameworkRead(BaseModel):
    """A framework CatalogItem this user owns (direct purchase or live plan
    entitlement) that has test_workflow_file configured, with the caller's
    current usage against its run quota."""

    slug: str
    title: str
    includedRuns: int
    usedRuns: int
    remainingRuns: int
    inputSchema: list[TestInputVariableRead] = []


class TestExecutionConfigValueRead(BaseModel):
    """One saved variable's display state for the "Configurar" form. `value`
    is only ever populated for non-secret types (prefill convenience);
    secret-typed entries only ever expose `hasValue`, never the plaintext —
    same one-way-after-creation posture as ApiCredential.client_secret."""

    key: str
    label: str
    type: str
    required: bool
    description: str | None = None
    options: list[str] | None = None
    default: str | None = None
    hasValue: bool = False
    value: str | None = None


class TestScenarioSummaryRead(BaseModel):
    """One saved scenario's identity, without its values — powers the
    scenario picker/list without decrypting anything that isn't being shown."""

    uuid: UUID
    name: str
    isDefault: bool
    updatedAt: datetime


class TestScenarioRead(TestScenarioSummaryRead):
    """A single scenario's full detail — identity plus its current values,
    same value shape as before (secret-typed entries only ever expose
    `hasValue`, never the plaintext)."""

    values: list[TestExecutionConfigValueRead]


class TestScenarioListResponse(BaseModel):
    items: list[TestScenarioSummaryRead]


class TestScenarioCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    # key -> raw value. Empty/omitted keys are simply left unset.
    values: dict[str, str] = {}


class TestScenarioUpdateRequest(BaseModel):
    # Both optional and independently patchable — renaming a scenario
    # shouldn't require resending every value, and vice versa.
    name: str | None = Field(default=None, min_length=1, max_length=150)
    # key -> raw value. An empty string clears/unsets that key rather than
    # saving an empty ciphertext. Omitted entirely (None) leaves all values
    # untouched (a rename-only call).
    values: dict[str, str] | None = None


class TestRunTriggerRequest(BaseModel):
    slug: str
    # Branch/tag to run against — defaults to "main" in the service layer.
    # Exposed so a customer testing a feature branch of their own framework
    # repo isn't limited to whatever the admin last set as default.
    ref: str | None = None
    # Inline workflow_dispatch input values for this one call — for CI/CD
    # callers that manage their own secrets (e.g. via GitHub Secrets on
    # their end) rather than saving them in a scenario. Per-key,
    # overrides/supplements the resolved scenario; either source may be
    # partial as long as the union covers every required key.
    variables: dict[str, str] | None = None
    # Picks a specific saved scenario by uuid; omitted, the scenario
    # flagged "default" is used (or none, if the caller never saved one).
    scenarioUuid: UUID | None = None


class PrivateTestRunTriggerRequest(BaseModel):
    """Dashboard "Probar ahora" trigger — slug comes from the URL path, no
    client_id/client_secret involved. Uses the caller's chosen (or default)
    saved scenario; `variables` here only ever needed for a one-off
    override without editing the scenario itself."""

    ref: str | None = None
    variables: dict[str, str] | None = None
    scenarioUuid: UUID | None = None


class TestRunRead(BaseModel):
    uuid: UUID
    catalogItemSlug: str
    status: TestRunStatus
    conclusion: TestRunConclusion | None = None
    githubRunUrl: str | None = None
    errorMessage: str | None = None
    progressPercent: int | None = None
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    createdAt: datetime


class TestRunListResponse(BaseModel):
    items: list[TestRunRead]
    limit: int
    offset: int
    total: int


class TestRunStepRead(BaseModel):
    """One GitHub Actions job step, straight off the Jobs API — used to
    render the ASE-branded report's timeline without ever touching the raw
    artifact HTML."""

    name: str
    status: str | None = None
    conclusion: str | None = None
    startedAt: datetime | None = None
    completedAt: datetime | None = None


class TestRunJobRead(BaseModel):
    name: str
    status: str | None = None
    conclusion: str | None = None
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    steps: list[TestRunStepRead] = []


class TestRunTestCountsRead(BaseModel):
    """Best-effort passed/failed/skipped/error counts scraped out of the
    uploaded report's own text (see service._extract_test_summary) — any
    key can be missing if that word never appeared, since report tooling
    and versions vary; the frontend should treat a missing key as unknown,
    not zero."""

    passed: int | None = None
    failed: int | None = None
    skipped: int | None = None
    error: int | None = None


class DynamicRequestDetailRead(BaseModel):
    """Parsed `request_result.json` artifact from a buyer's
    test_dynamic_request.py — the exact method/url/status/body of the one
    arbitrary-endpoint call that run made, so it can be rendered as its own
    card instead of a raw downloadable artifact. `params`/`body`/
    `responseBody`/`expectedSchema` are `Any` because they're whatever JSON
    shape the buyer's own endpoint and inputs produced — a list, an object,
    a bare string, a number, doesn't matter, this is display-only."""

    method: str
    url: str
    endpoint: str | None = None
    params: object | None = None
    body: object | None = None
    statusCode: int
    responseHeaders: dict[str, str] = {}
    responseBody: object | None = None
    elapsedMs: float | None = None
    result: str
    expectedStatus: int | None = None
    expectedSchema: object | None = None
    schemaError: str | None = None


class TestRunSummaryRead(BaseModel):
    """Structured data behind the ASE-branded report view — built entirely
    from GitHub's Jobs API plus a best-effort scrape of the raw artifact,
    so the report renders consistently even when the uploaded HTML itself
    is missing, malformed, or from a tool this platform doesn't specially
    understand. `originalReportAvailable` tells the frontend whether the
    "view the original report" link/button has anything to point at."""

    runUuid: UUID
    frameworkTitle: str
    status: TestRunStatus
    conclusion: TestRunConclusion | None = None
    progressPercent: int | None = None
    createdAt: datetime
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    durationSeconds: int | None = None
    githubRunUrl: str | None = None
    errorMessage: str | None = None
    testSummary: TestRunTestCountsRead | None = None
    jobs: list[TestRunJobRead] = []
    originalReportAvailable: bool = False
    dynamicRequest: DynamicRequestDetailRead | None = None


class AdminResetQuotaRequest(BaseModel):
    """Admin-only: which buyer to grant a fresh run quota to, by email
    rather than internal id — matches how an admin identifies a customer
    day-to-day (support ticket, account lookup)."""

    userEmail: str = Field(min_length=1, max_length=255)


class AdminResetQuotaResponse(BaseModel):
    slug: str
    userEmail: str
    includedRuns: int
    usedRuns: int


class ApprovedRefRead(BaseModel):
    """One git ref (branch/tag) this buyer is allowed to dispatch this
    framework against, in addition to the always-allowed default branch —
    powers the buyer-facing "version" picker (original vs. my branch)."""

    ref: str
    label: str | None = None
    approvedAt: datetime


class AdminApproveRefRequest(BaseModel):
    userEmail: str = Field(min_length=1, max_length=255)
    ref: str = Field(min_length=1, max_length=255)
    label: str | None = Field(default=None, max_length=200)


class AdminApproveRefResponse(BaseModel):
    slug: str
    userEmail: str
    ref: str
    label: str | None = None


class AdminRevokeRefRequest(BaseModel):
    userEmail: str = Field(min_length=1, max_length=255)
    ref: str = Field(min_length=1, max_length=255)
