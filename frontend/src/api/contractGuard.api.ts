import { apiClient } from './client'

/**
 * ASE API Contract Guard, consumido a través de la pasarela de ASE
 * (backend: app/modules/contract_guard). Los tipos reflejan el contrato del
 * servicio: sin envoltorio `data`, listados como arrays y fechas ISO 8601
 * (UTC aunque falte el sufijo de zona).
 */

const BASE = '/product-tools/contract-guard'

export type CgStatus = {
  configured: boolean
  available: boolean
  engineVersion: string | null
  maxProjects?: number
}

export type CgProject = {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type CgContract = {
  id: string
  project_id: string
  version_label: string
  original_filename: string
  content_hash: string
  openapi_version: string
  created_at: string
}

export type CgContractDetail = CgContract & { specification_content: string }

export type CgOverallResult = 'breaking' | 'review_required' | 'compatible'
export type CgSeverity = 'breaking' | 'potentially_breaking' | 'non_breaking' | 'informational'

export type CgSummary = {
  breaking: number
  potentially_breaking: number
  non_breaking: number
  informational: number
  total: number
}

export type CgFinding = {
  id: string
  rule_id: string
  /** operation | request | response | servers, y las que lleguen en el futuro. */
  category: string
  severity: CgSeverity
  location: string
  description: string
  previous_value: unknown
  current_value: unknown
  recommendation: string
  engine_metadata?: Record<string, unknown>
}

/** Fila del historial: sin proyecto, contratos ni hallazgos anidados. */
export type CgComparisonRun = {
  id: string
  project_id: string
  baseline_id: string
  candidate_id: string
  created_at: string
  engine_version: string
  engine_configuration: Record<string, unknown>
  overall_result: CgOverallResult
  summary: CgSummary
}

export type CgComparisonReport = CgComparisonRun & {
  project: CgProject
  baseline: CgContract
  candidate: CgContract
  engine: { name: string; version: string; configuration: Record<string, unknown> }
  findings: CgFinding[]
}

export type CgValidationError = { path: string; schema_path: string; rule: string; message: string }

export type CgValidationReport = {
  valid: boolean
  error_count: number
  truncated: boolean
  validation_scope: 'json_body' | 'body_presence_only'
  errors: CgValidationError[]
  warnings: string[]
  validator?: { name: string; version: string; dialect: string; max_errors: number }
  selection?: {
    requested_path: string
    path_template: string
    method: string
    status_code: string | number
    response_key: string
    content_type: string
    media_type_key?: string
    schema_ref?: string
  }
  project_id?: string
  contract_id?: string
  version_label?: string
  content_hash?: string
}

export type CgHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

export type CgValidateResponseInput = {
  path: string
  method: CgHttpMethod
  status_code: number
  content_type: string
  response_body: unknown
  body_present: boolean
}

export async function getContractGuardStatus() {
  const { data } = await apiClient.get<CgStatus>(`${BASE}/status`)
  return data
}

export async function listCgProjects() {
  const { data } = await apiClient.get<CgProject[]>(`${BASE}/projects`)
  return data
}

export async function createCgProject(input: { name: string; description?: string }) {
  const { data } = await apiClient.post<CgProject>(`${BASE}/projects`, input)
  return data
}

export async function updateCgProject(id: string, input: { name?: string; description?: string }) {
  const { data } = await apiClient.patch<CgProject>(`${BASE}/projects/${id}`, input)
  return data
}

export async function deleteCgProject(id: string, confirmName: string) {
  await apiClient.delete(`${BASE}/projects/${id}`, { params: { confirm_name: confirmName } })
}

export async function listCgContracts(projectId: string, params?: { offset?: number; limit?: number }) {
  const { data } = await apiClient.get<CgContract[]>(`${BASE}/projects/${projectId}/contracts`, { params })
  return data
}

export async function getCgContract(projectId: string, versionId: string) {
  const { data } = await apiClient.get<CgContractDetail>(`${BASE}/projects/${projectId}/contracts/${versionId}`)
  return data
}

export async function importCgContract(projectId: string, input: { versionLabel: string; file: File }) {
  const form = new FormData()
  form.append('version_label', input.versionLabel)
  form.append('file', input.file)
  // Sin Content-Type explícito: axios/navegador generan el boundary.
  const { data } = await apiClient.post<CgContract>(`${BASE}/projects/${projectId}/contracts`, form)
  return data
}

export async function createCgComparison(projectId: string, input: { baselineId: string; candidateId: string }) {
  const { data } = await apiClient.post<CgComparisonReport>(`${BASE}/projects/${projectId}/comparisons`, {
    baseline_id: input.baselineId,
    candidate_id: input.candidateId,
  })
  return data
}

export async function listCgComparisons(projectId: string, params?: { offset?: number; limit?: number }) {
  const { data } = await apiClient.get<CgComparisonRun[]>(`${BASE}/projects/${projectId}/comparisons`, { params })
  return data
}

export async function getCgComparison(comparisonId: string) {
  const { data } = await apiClient.get<CgComparisonReport>(`${BASE}/comparisons/${comparisonId}`)
  return data
}

/** Descarga el informe completo como archivo (JSON) con el nombre del servicio. */
export async function downloadCgComparison(comparisonId: string) {
  const { data } = await apiClient.get<Blob>(`${BASE}/comparisons/${comparisonId}/export`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `comparison-${comparisonId}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function validateCgResponse(projectId: string, versionId: string, input: CgValidateResponseInput) {
  const { data } = await apiClient.post<CgValidationReport>(
    `${BASE}/projects/${projectId}/contracts/${versionId}/validate-response`,
    input,
  )
  return data
}

export async function validateCgSchema(input: { schema: unknown; responseBody: unknown }) {
  const { data } = await apiClient.post<CgValidationReport>(`${BASE}/validations/schema`, {
    schema: input.schema,
    response_body: input.responseBody,
  })
  return data
}

export async function validateCgSchemaFiles(input: { schemaFile: File; responseFile: File }) {
  const form = new FormData()
  form.append('schema_file', input.schemaFile)
  form.append('response_file', input.responseFile)
  const { data } = await apiClient.post<CgValidationReport>(`${BASE}/validations/schema/files`, form)
  return data
}
