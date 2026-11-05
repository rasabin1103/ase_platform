import { apiClient } from './client'

/** Gestión de autónomo nativa de ASE (backend: app/modules/freelance).
 * Importes en céntimos; el servidor calcula todos los totales. */
const BASE = '/freelance'

export type FlProfile = {
  name: string
  taxid: string
  address: string
  email: string
  iban: string
  invoiceColor: string
  logo: string | null
}

export type FlClient = {
  id: number
  name: string
  taxid: string
  address: string
  email: string
  startDate: string | null
  paymentRule: 'nextMonth' | 'days'
  paymentDays: number
  extraIrpf: number
}
export type FlClientInput = Omit<FlClient, 'id'>

export type FlLineInput = { description: string; unit: 'días' | 'horas'; quantity: number; rate: number }
export type FlInvoice = {
  id: number
  clientId: number
  number: string
  date: string
  due: string | null
  serviceMonth: string | null
  description: string
  vat: number
  irpf: number
  lines: Array<{ description: string; unit: string; quantity: string; rate: string; baseCents: number }>
  baseCents: number
  vatCents: number
  irpfCents: number
  totalCents: number
  paid: boolean
  paidDate: string | null
  clientSnapshot: { name: string }
}
export type FlInvoiceInput = {
  clientId: number
  date: string
  due?: string | null
  serviceMonth?: string | null
  description: string
  vat: number
  irpf: number
  lines: FlLineInput[]
}

export type FlExpenseInput = {
  supplier: string
  description: string
  reference: string
  date: string
  base: number
  vat: number
  deductible: number
  vatDeductible: number
  paid: boolean
  paidDate?: string | null
}
export type FlExpense = FlExpenseInput & {
  id: number
  baseCents: number
  vatCents: number
  totalCents: number
  recurringRuleId: number | null
}
export type FlRecurring = { id: number; nextDate: string; day: number; active: boolean; template: Partial<FlExpenseInput> }

export type FlCash = { receipts: number; cost: number; vat: number; reserve: number; allocated: number; available: number }
export type FlForecast = { days: number; income: number; expenses: number; recurring: number; allocation: number }
export type FlNoticeInvoice = { id: number; number: string; client: string; totalCents: number; due: string | null }
export type FlSummary = {
  today: string
  cash: FlCash
  forecast: FlForecast[]
  receivable: { cents: number; count: number }
  payable: { cents: number; count: number }
  notices: {
    late: FlNoticeInvoice[]
    lateTotalCents: number
    upcoming: FlNoticeInvoice[]
    upcomingTotalCents: number
  }
}

export type FlMonth = {
  m: number
  key: string
  income: number
  expenses: number
  vat: number
  vatIn: number
  vatNet: number
  irpf: number
  reserve: number
  netExpenses: number
  net: number
  days: number
  hours: number
  weekdays: number
  vacations: number
  holidays: number
  available: number
}
export type FlProfitRow = {
  clientId: number
  name: string
  baseCents: number
  avgDayCents: number | null
  avgHourCents: number | null
  expenseShareCents: number
  netCents: number
  avgDelayDays: number | null
}
export type FlDashboard = { year: number; months: FlMonth[]; profitability: FlProfitRow[] }

export type FlGoal = {
  reference: { year: number; rate: number; hasInvoices: boolean; suggestedMonthlyCost: number }
  result: { base: number; day: number | null; hour: number | null } | null
}

export type FlSimInput = { mode: 'percent' | 'amount'; percent: number; dayExtra: number; hourExtra: number }
export type FlSimRow = {
  key: string
  current: number
  simulated: number
  net: number
  simNet: number
  total: number
  simTotal: number
}
export type FlSimulation = { rows: FlSimRow[]; totals: Record<string, number> }

export type FlTimesheet = {
  month: string
  vacations: string[]
  holidays: string[]
  weekdays: number
  available: number
}

export type FlPlanInput = {
  category: 'saving' | 'investment'
  name: string
  startMonth: string
  horizon: number
  annualRate: number
  initial: number
  monthly: number
  target: number
  active: boolean
}
export type FlPlan = {
  id: number
  category: 'saving' | 'investment'
  name: string
  startMonth: string
  horizon: number
  annualRate: number
  initialCents: number
  monthlyCents: number
  targetCents: number
  active: boolean
  projection: Array<{ key: string; value: number; capital: number; gain: number }>
  actual: { balance: number; contributed: number; withdrawn: number; gain: number }
}
export type FlEntry = {
  id: number
  planId: number
  action: 'contribution' | 'withdrawal' | 'valuation'
  date: string
  amountCents: number
  fromBusiness: boolean
  note: string
}
export type FlWealth = { plans: FlPlan[]; entries: FlEntry[] }

export const getFlAccess = () => apiClient.get<{ allowed: boolean }>(`${BASE}/access`).then((r) => r.data.allowed)
export const getFlSummary = () => apiClient.get<FlSummary>(`${BASE}/summary`).then((r) => r.data)
export const getFlDashboard = (year: number, concept = '') =>
  apiClient.get<FlDashboard>(`${BASE}/dashboard`, { params: { year, concept } }).then((r) => r.data)
export const getFlGoal = (p: { year: number; net: number; cost: number; days: number; hours: number; rate?: number }) =>
  apiClient.get<FlGoal>(`${BASE}/goal`, { params: p }).then((r) => r.data)
export const runFlSimulation = (b: FlSimInput) => apiClient.post<FlSimulation>(`${BASE}/simulator`, b).then((r) => r.data)

export const getFlProfile = () => apiClient.get<FlProfile | null>(`${BASE}/profile`).then((r) => r.data)
export const saveFlProfile = (b: FlProfile) => apiClient.put<FlProfile>(`${BASE}/profile`, b).then((r) => r.data)
export type FlCashSettings = { openingBalance: number; withdrawals: number; vatPaid: number; extraIrpfUsed: number }
export const getFlCashSettings = () => apiClient.get<FlCashSettings>(`${BASE}/cash-settings`).then((r) => r.data)
export const saveFlCashSettings = (b: FlCashSettings) =>
  apiClient.put<FlCashSettings>(`${BASE}/cash-settings`, b).then((r) => r.data)

export const listFlClients = () => apiClient.get<FlClient[]>(`${BASE}/clients`).then((r) => r.data)
export const saveFlClient = (b: FlClientInput, id?: number) =>
  (id ? apiClient.put<FlClient>(`${BASE}/clients/${id}`, b) : apiClient.post<FlClient>(`${BASE}/clients`, b)).then((r) => r.data)
export const deleteFlClient = (id: number) => apiClient.delete(`${BASE}/clients/${id}`)

export const listFlInvoices = () => apiClient.get<FlInvoice[]>(`${BASE}/invoices`).then((r) => r.data)
export const createFlInvoice = (b: FlInvoiceInput) => apiClient.post<FlInvoice>(`${BASE}/invoices`, b).then((r) => r.data)
export const setFlInvoicePayment = (id: number, paid: boolean, paidDate?: string) =>
  apiClient.put<FlInvoice>(`${BASE}/invoices/${id}/payment`, { paid, paidDate }).then((r) => r.data)
export const deleteFlInvoice = (id: number) => apiClient.delete(`${BASE}/invoices/${id}`)

export const listFlExpenses = () => apiClient.get<FlExpense[]>(`${BASE}/expenses`).then((r) => r.data)
export const saveFlExpense = (b: FlExpenseInput, id?: number) =>
  (id ? apiClient.put<FlExpense>(`${BASE}/expenses/${id}`, b) : apiClient.post<FlExpense>(`${BASE}/expenses`, b)).then((r) => r.data)
export const deleteFlExpense = (id: number) => apiClient.delete(`${BASE}/expenses/${id}`)

export const listFlRecurring = () => apiClient.get<FlRecurring[]>(`${BASE}/recurring`).then((r) => r.data)
export const saveFlRecurring = (b: { expense: FlExpenseInput; day: number; startDate: string; active: boolean }, id?: number) =>
  (id ? apiClient.put(`${BASE}/recurring/${id}`, b) : apiClient.post(`${BASE}/recurring`, b)).then((r) => r.data)
export const deleteFlRecurring = (id: number) => apiClient.delete(`${BASE}/recurring/${id}`)

export const getFlTimesheet = (month: string) => apiClient.get<FlTimesheet>(`${BASE}/timesheets/${month}`).then((r) => r.data)
export const saveFlTimesheet = (month: string, b: { vacations: string[]; holidays: string[] }) =>
  apiClient.put<FlTimesheet>(`${BASE}/timesheets/${month}`, b).then((r) => r.data)

export const getFlWealth = () => apiClient.get<FlWealth>(`${BASE}/wealth`).then((r) => r.data)
export const saveFlPlan = (b: FlPlanInput, id?: number) =>
  (id ? apiClient.put(`${BASE}/wealth/plans/${id}`, b) : apiClient.post(`${BASE}/wealth/plans`, b)).then((r) => r.data)
export const deleteFlPlan = (id: number) => apiClient.delete(`${BASE}/wealth/plans/${id}`)
export const addFlEntry = (
  planId: number,
  b: { action: FlEntry['action']; date: string; amount: number; fromBusiness: boolean; note: string },
) => apiClient.post(`${BASE}/wealth/plans/${planId}/entries`, b).then((r) => r.data)
export const deleteFlEntry = (id: number) => apiClient.delete(`${BASE}/wealth/entries/${id}`)

/** Descarga un PDF autenticado (la cabecera Bearer impide un enlace directo). */
export async function downloadFlPdf(path: string, filename: string) {
  const res = await apiClient.get<Blob>(`${BASE}${path}`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadFlBackup() {
  const res = await apiClient.get(`${BASE}/backup`)
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ase-freelance-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
