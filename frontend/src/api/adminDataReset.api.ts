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
