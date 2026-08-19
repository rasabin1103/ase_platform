import { apiClient } from './client'

export type DemoAccount = {
  email: string
  // Null for the plan-less independent demo account.
  plan_code: string | null
  plan_name: string | null
  already_existed: boolean
  catalog_items_granted: number
}

export type SeedDemoUsersResponse = {
  accounts: DemoAccount[]
  demo_password: string
  note: string
}

export async function seedDemoPaidUsers() {
  const { data } = await apiClient.post<SeedDemoUsersResponse>('/admin/demo-data/seed-paid-users')
  return data
}
