import { Badge } from '../components/ui/Badge'
import type { BillingCycle, Plan, PlanStatus } from '../types/plan.types'

export type CreateValues = {
  code: string
  name: string
  short_description?: string | ''
  description?: string | ''
  billing_cycle: BillingCycle
  price?: string | ''
  currency: string
  display_order?: string | ''
  is_recommended: boolean
  status: PlanStatus
  cta_label?: string | ''
  stripe_price_id?: string | ''
  name_en?: string | ''
  short_description_en?: string | ''
  description_en?: string | ''
  cta_label_en?: string | ''
  monthly_download_limit?: string | ''
  monthly_ai_analysis_limit?: string | ''
  loyalty_bonus_downloads?: string | ''
  loyalty_bonus_interval_months?: string | ''
}

export type EditValues = {
  code?: string | ''
  name?: string | ''
  short_description?: string | ''
  description?: string | ''
  billing_cycle?: BillingCycle
  price?: string | ''
  currency?: string | ''
  display_order?: string | ''
  is_recommended?: boolean
  status?: PlanStatus
  cta_label?: string | ''
  stripe_price_id?: string | ''
  name_en?: string | ''
  short_description_en?: string | ''
  description_en?: string | ''
  cta_label_en?: string | ''
  monthly_download_limit?: string | ''
  monthly_ai_analysis_limit?: string | ''
  loyalty_bonus_downloads?: string | ''
  loyalty_bonus_interval_months?: string | ''
  clear_monthly_download_limit?: boolean
  clear_monthly_ai_analysis_limit?: boolean
  clear_loyalty_bonus?: boolean
}

export function fmtMoney(price: string | null, currency: string) {
  if (!price) return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} ${currency}`
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

export function billingBadge(t: (k: string) => unknown, cycle: BillingCycle) {
  const label =
    cycle === 'monthly'
      ? (t('plansPage.badges.monthly') as string)
      : cycle === 'yearly'
        ? (t('plansPage.badges.yearly') as string)
        : (t('plansPage.badges.oneTime') as string)
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2">
      {label}
    </span>
  )
}

export function statusBadge(t: (k: string) => unknown, status: Plan['status']) {
  if (status === 'coming_soon') {
    return <Badge variant="info">{t('plansPage.status.coming_soon') as string}</Badge>
  }
  if (status === 'inactive') {
    return <Badge variant="warning">{t('plansPage.status.inactive') as string}</Badge>
  }
  return <Badge variant="success">{t('plansPage.status.active') as string}</Badge>
}
