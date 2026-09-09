import { apiClient } from './client'

export type DataDomain = {
  key: string
  label: string
  tables: string[]
  row_count: number
  extra_tables: string[]
  confirm_phrase: string
  is_special: boolean
}

export type DataDomainListResponse = {
  domains: DataDomain[]
  master_confirm_phrase: string
  super_admin_email: string
}

export async function listDataResetDomains() {
  const { data } = await apiClient.get<DataDomainListResponse>('/admin/data-reset/domains')
  return data
}

export type ResetExecuteResponse = {
  tables_wiped: string[]
  rows_deleted: number
  preserved_user_email: string
  message: string
}

export async function resetDataDomain(domainKey: string, confirmPhrase: string, password: string) {
  const { data } = await apiClient.post<ResetExecuteResponse>(`/admin/data-reset/domain/${domainKey}`, {
    confirm_phrase: confirmPhrase,
    password,
  })
  return data
}

export async function resetAllData(confirmPhrase: string, password: string) {
  const { data } = await apiClient.post<ResetExecuteResponse>('/admin/data-reset/all', {
    confirm_phrase: confirmPhrase,
    password,
  })
  return data
}

export type DataRow = {
  id: number
  columns: Record<string, string | null>
  protected: boolean
}

export type DataRowListResponse = {
  table: string
  tables: string[]
  columns: string[]
  rows: DataRow[]
  total: number
  page: number
  page_size: number
}

export async function listDataResetRows(
  domainKey: string,
  table: string | undefined,
  page: number,
  pageSize: number,
) {
  const { data } = await apiClient.get<DataRowListResponse>(`/admin/data-reset/domain/${domainKey}/rows`, {
    params: { table, page, page_size: pageSize },
  })
  return data
}

export type RowDeleteResponse = {
  table: string
  rows_deleted: number
  message: string
}

export async function deleteDataResetRows(domainKey: string, table: string, ids: number[], password: string) {
  const { data } = await apiClient.post<RowDeleteResponse>(`/admin/data-reset/domain/${domainKey}/rows/delete`, {
    table,
    ids,
    password,
  })
  return data
}

export type RowExportResponse = {
  table: string
  columns: string[]
  rows: Record<string, string | null>[]
  total: number
  truncated: boolean
}

// ids omitted/undefined = export every row currently in `table` (used before
// wiping a whole domain). ids provided = export just those rows (used before
// a row-level delete).
export async function exportDataResetRows(domainKey: string, table: string, ids?: number[]) {
  const { data } = await apiClient.post<RowExportResponse>(`/admin/data-reset/domain/${domainKey}/rows/export`, {
    table,
    ids,
  })
  return data
}
