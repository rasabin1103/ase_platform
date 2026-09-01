import { apiClient } from './client'

export type ApiCredential = {
  uuid: string
  name: string
  clientId: string
  status: 'active' | 'revoked'
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

// Only present in the response to the creation call itself — the raw
// secret is never stored and never returned again after this.
export type ApiCredentialCreateResponse = ApiCredential & { clientSecret: string }

// Admin-declared workflow_dispatch input this framework expects — mirrors
// catalogAdmin.api.ts's TestInputVariableDef (kept as its own copy, same
// pattern used throughout this codebase for small cross-module schemas).
export type TestInputVariableDef = {
  key: string
  label: string
  type: 'text' | 'secret' | 'choice' | 'json'
  required: boolean
  description?: string | null
  options?: string[] | null
  default?: string | null
}

export type RunnableFramework = {
  slug: string
  title: string
  includedRuns: number
  usedRuns: number
  remainingRuns: number
  inputSchema: TestInputVariableDef[]
}

// One saved variable's display state for the "Configurar" form. `value` is
// only ever populated for non-secret types; secret-typed entries only ever
// expose `hasValue`, never the plaintext.
export type TestExecutionConfigValue = {
  key: string
  label: string
  type: 'text' | 'secret' | 'choice' | 'json'
  required: boolean
  description: string | null
  options: string[] | null
  default: string | null
  hasValue: boolean
  value: string | null
}

export type TestExecutionConfigResponse = {
  values: TestExecutionConfigValue[]
}

// A saved "scenario" — a named set of variable values for one framework.
// A buyer can save several (e.g. "Staging", "Production creds"); exactly
// one is flagged isDefault at any time, used whenever a trigger call
// doesn't name a scenario explicitly.
export type TestScenarioSummary = {
  uuid: string
  name: string
  isDefault: boolean
  updatedAt: string
}

export type TestScenario = TestScenarioSummary & {
  values: TestExecutionConfigValue[]
}

// A git ref (branch/tag) an admin has approved for this buyer to dispatch
// this framework against, besides the always-available default branch —
// see the backend's TestApprovedRef for the review workflow this supports
// (buyer clones the framework, pushes a branch, admin reviews + approves).
export type ApprovedRef = {
  ref: string
  label: string | null
  approvedAt: string
}

export type TestRunStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed_to_dispatch'
export type TestRunConclusion = 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required' | 'unknown'

export type TestRun = {
  uuid: string
  catalogItemSlug: string
  status: TestRunStatus
  conclusion: TestRunConclusion | null
  githubRunUrl: string | null
  errorMessage: string | null
  // Best-effort completion estimate (0-100), computed server-side from the
  // run's own GitHub Actions job/step counts — null until GitHub has
  // assigned a runner and reported at least one step.
  progressPercent: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export type TestRunListResponse = {
  items: TestRun[]
  limit: number
  offset: number
  total: number
}

export async function createApiCredential(name: string) {
  const { data } = await apiClient.post<ApiCredentialCreateResponse>('/test-execution/credentials', { name })
  return data
}

export async function listApiCredentials() {
  const { data } = await apiClient.get<ApiCredential[]>('/test-execution/credentials')
  return data
}

export async function renameApiCredential(credentialUuid: string, name: string) {
  const { data } = await apiClient.patch<ApiCredential>(`/test-execution/credentials/${credentialUuid}`, { name })
  return data
}

export async function revokeApiCredential(credentialUuid: string) {
  await apiClient.delete(`/test-execution/credentials/${credentialUuid}`)
}

export async function listRunnableFrameworks() {
  const { data } = await apiClient.get<RunnableFramework[]>('/test-execution/frameworks')
  return data
}

export async function listMyTestRuns(params?: { slug?: string; limit?: number; offset?: number }) {
  const { data } = await apiClient.get<TestRunListResponse>('/test-execution/runs', { params })
  return data
}

export async function getMyTestRun(runUuid: string) {
  const { data } = await apiClient.get<TestRun>(`/test-execution/runs/${runUuid}`)
  return data
}

// Removes a run from this user's own history — never a real delete, the row
// still counts against the run quota either way (see the backend's
// TestRun.hidden_at docstring).
export async function deleteTestRun(runUuid: string) {
  await apiClient.delete(`/test-execution/runs/${runUuid}`)
}

// Fetches the run's uploaded HTML report (e.g. pytest-html's
// --self-contained-html output) as raw HTML text — the caller wraps it in a
// Blob and opens it (same "authenticated fetch -> blob: URL" pattern as
// PdfViewer, since an <a href>/<iframe src> can't carry an Authorization
// header). Throws (404) if the run has no report available yet/at all.
export async function getTestRunReport(runUuid: string) {
  const { data } = await apiClient.get<string>(`/test-execution/runs/${runUuid}/report`)
  return data
}

export type TestRunStep = {
  name: string
  status: string | null
  conclusion: string | null
  startedAt: string | null
  completedAt: string | null
}

export type TestRunJob = {
  name: string
  status: string | null
  conclusion: string | null
  startedAt: string | null
  completedAt: string | null
  steps: TestRunStep[]
}

export type TestRunTestCounts = {
  passed?: number | null
  failed?: number | null
  skipped?: number | null
  error?: number | null
}

// Parsed `request_result.json` artifact from a buyer's
// test_dynamic_request.py — the one arbitrary-endpoint call that run made,
// rendered as its own card instead of a raw downloadable GitHub Actions
// artifact. `params`/`body`/`responseBody`/`expectedSchema` are unknown
// because they're whatever JSON shape the buyer's own endpoint/inputs
// produced — display-only, never interpreted.
export type DynamicRequestDetail = {
  method: string
  url: string
  endpoint: string | null
  params: unknown
  body: unknown
  statusCode: number
  responseHeaders: Record<string, string>
  responseBody: unknown
  elapsedMs: number | null
  result: string
  expectedStatus: number | null
  expectedSchema: unknown
  schemaError: string | null
}

export type TestRunSummary = {
  runUuid: string
  frameworkTitle: string
  status: TestRunStatus
  conclusion: TestRunConclusion | null
  progressPercent: number | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  githubRunUrl: string | null
  errorMessage: string | null
  testSummary: TestRunTestCounts | null
  jobs: TestRunJob[]
  originalReportAvailable: boolean
  dynamicRequest: DynamicRequestDetail | null
}

// Structured data behind the ASE-branded report view — never 404s just
// because the artifact isn't ready yet (unlike getTestRunReport); it
// renders with whatever's known so far (see the backend's get_run_summary).
export async function getTestRunSummary(runUuid: string) {
  const { data } = await apiClient.get<TestRunSummary>(`/test-execution/runs/${runUuid}/summary`)
  return data
}

// Raw console output for one job of the run (GitHub's own log, not a
// report-tool artifact) — the "detailed output" view: whatever the test
// step actually printed, including a service's response body or a failing
// test's traceback, regardless of what testing tool the framework uses.
// Throws (404) if the run has no logs available yet/at all.
export async function getTestRunLogs(runUuid: string, jobIndex = 0) {
  const { data } = await apiClient.get<string>(`/test-execution/runs/${runUuid}/logs`, {
    params: { job: jobIndex },
  })
  return data
}

// --- Buyer-configured variables — saved "scenarios" -------------------------

export async function listApprovedRefs(slug: string) {
  const { data } = await apiClient.get<ApprovedRef[]>(`/test-execution/frameworks/${slug}/approved-refs`)
  return data
}

export async function listFrameworkScenarios(slug: string) {
  const { data } = await apiClient.get<{ items: TestScenarioSummary[] }>(
    `/test-execution/frameworks/${slug}/scenarios`,
  )
  return data.items
}

export async function getFrameworkScenario(slug: string, scenarioUuid: string) {
  const { data } = await apiClient.get<TestScenario>(
    `/test-execution/frameworks/${slug}/scenarios/${scenarioUuid}`,
  )
  return data
}

export async function createFrameworkScenario(slug: string, name: string, values: Record<string, string> = {}) {
  const { data } = await apiClient.post<TestScenario>(`/test-execution/frameworks/${slug}/scenarios`, {
    name,
    values,
  })
  return data
}

// Both `name` and `values` are independently optional — omit `values`
// entirely for a rename-only call. An empty string for a value key
// clears/unsets it rather than saving an empty ciphertext.
export async function updateFrameworkScenario(
  slug: string,
  scenarioUuid: string,
  patch: { name?: string; values?: Record<string, string> },
) {
  const { data } = await apiClient.put<TestScenario>(
    `/test-execution/frameworks/${slug}/scenarios/${scenarioUuid}`,
    patch,
  )
  return data
}

export async function setDefaultFrameworkScenario(slug: string, scenarioUuid: string) {
  const { data } = await apiClient.post<TestScenarioSummary>(
    `/test-execution/frameworks/${slug}/scenarios/${scenarioUuid}/default`,
  )
  return data
}

export async function deleteFrameworkScenario(slug: string, scenarioUuid: string) {
  await apiClient.delete(`/test-execution/frameworks/${slug}/scenarios/${scenarioUuid}`)
}

// "Probar ahora" — triggers a run using the caller's own session. Omitting
// `scenarioUuid` uses whichever saved scenario is flagged default (or none,
// if the buyer never saved one); `variables` is only needed for a one-off
// override without editing the scenario itself.
export async function triggerTestRun(
  slug: string,
  options?: { ref?: string; variables?: Record<string, string>; scenarioUuid?: string },
) {
  const { data } = await apiClient.post<TestRun>(`/test-execution/frameworks/${slug}/trigger`, {
    ref: options?.ref ?? null,
    variables: options?.variables ?? null,
    scenarioUuid: options?.scenarioUuid ?? null,
  })
  return data
}
