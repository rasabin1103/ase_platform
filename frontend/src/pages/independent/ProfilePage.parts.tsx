import { type PlanSummary } from '../../api/consumerCatalog.api'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
      <span className="text-sm text-ase-muted">{label}</span>
      <span className="text-sm font-medium text-ase-text">{value}</span>
    </div>
  )
}

/** "Your plan" summary card — downloads used/remaining this month, the best
 * discount available on items not included in the plan, and a countdown to
 * the next loyalty-bonus month. All figures come straight from
 * GET /consumer-catalog/me/plan-summary (see app.modules.plans.quota) —
 * nothing here is estimated or invented client-side. */
export function PlanSummaryCard({ summary, t }: { summary: PlanSummary; t: (k: string) => unknown }) {
  const title = String(t('profilePage.planSummary.title')).replace('{{planName}}', summary.planName ?? '')
  const downloadsValue = summary.unlimitedDownloads
    ? (t('profilePage.planSummary.unlimitedDownloads') as string)
    : String(t('profilePage.planSummary.downloadsOf'))
        .replace('{{used}}', String(summary.downloadsUsed ?? 0))
        .replace('{{limit}}', String(summary.monthlyDownloadLimit ?? 0))
  const hasDiscount = summary.discountItemCount > 0 && summary.maxDiscountPercent != null
  const hasLoyalty = Boolean(summary.loyaltyBonusDownloads && summary.loyaltyBonusIntervalMonths)

  return (
    <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-ase-text">{title}</h2>
        <Badge variant="success">{t('profilePage.planSummary.active') as string}</Badge>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label={t('profilePage.planSummary.monthlyDownloads') as string} value={downloadsValue} />
        {hasDiscount ? (
          <SummaryStat
            label={t('profilePage.planSummary.purchaseDiscount') as string}
            value={`${summary.maxDiscountPercent}%`}
            hint={String(t('profilePage.planSummary.discountOnItems')).replace(
              '{{count}}',
              String(summary.discountItemCount),
            )}
          />
        ) : null}
        {hasLoyalty ? (
          <SummaryStat
            label={t('profilePage.planSummary.loyaltyBonus') as string}
            value={String(t('profilePage.planSummary.loyaltyBonusValue'))
              .replace('{{amount}}', String(summary.loyaltyBonusDownloads))
              .replace('{{interval}}', String(summary.loyaltyBonusIntervalMonths))}
          />
        ) : null}
        {hasLoyalty && summary.nextRewardInDays != null ? (
          <SummaryStat
            label={t('profilePage.planSummary.nextReward') as string}
            value={
              summary.nextRewardInDays <= 0
                ? (t('profilePage.planSummary.nextRewardToday') as string)
                : String(t('profilePage.planSummary.nextRewardInDays')).replace(
                    '{{days}}',
                    String(summary.nextRewardInDays),
                  )
            }
          />
        ) : null}
      </div>
    </Card>
  )
}

export function SummaryStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ase-text">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-ase-text2">{hint}</div> : null}
    </div>
  )
}
