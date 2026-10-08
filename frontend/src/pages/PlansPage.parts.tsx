import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import { useI18n } from '../i18n'
import type { Plan } from '../types/plan.types'
import { billingBadge, fmtMoney, statusBadge } from './PlansPage.utils'

export function PricingCard({ plan }: { plan: Plan }) {
  const { t } = useI18n()
  const price = fmtMoney(plan.price, plan.currency)
  return (
    <Card
      interactive
      className={cn(
        'relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/40 p-6',
        plan.is_recommended &&
          'border-ase-primary/25 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_18px_70px_rgba(0,0,0,0.55)]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold tracking-tight text-ase-text" title={plan.name}>
            {plan.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {billingBadge(t, plan.billing_cycle)}
            {plan.is_recommended ? <Badge variant="info">{t('plansPage.badges.recommended')}</Badge> : null}
            {statusBadge(t, plan.status)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tracking-tight text-ase-text">
            {price ?? (t('plansPage.price.custom') as string)}
          </div>
          <div className="mt-1 text-xs text-ase-muted">{plan.currency}</div>
        </div>
      </div>
      {plan.short_description || plan.description ? (
        <div
          className="mt-4 line-clamp-2 text-sm text-ase-text2"
          title={plan.short_description ?? plan.description ?? ''}
        >
          {plan.short_description ?? plan.description}
        </div>
      ) : null}
      {(plan.included_catalog_items?.length ?? 0) > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ase-text2">
          {(plan.included_catalog_items ?? []).slice(0, 4).map((ci) => (
            <li key={ci.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ase-accent/80" />
              <span className="line-clamp-1" title={ci.title}>
                {ci.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (plan.features?.length ?? 0) > 0 ? (
        // Legacy fallback — only reached for plans created before the
        // catalog-item picker existed and never re-saved since.
        <ul className="mt-4 space-y-2 text-sm text-ase-text2">
          {(plan.features ?? []).slice(0, 4).map((f) => (
            <li key={f.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ase-accent/80" />
              <span className="line-clamp-1" title={f.text}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5">
        <Button className="w-full" variant={plan.is_recommended ? 'primary' : 'secondary'}>
          {plan.cta_label || (plan.is_recommended ? (t('plansPage.badges.recommended') as string) : plan.name)}
        </Button>
      </div>
    </Card>
  )
}

export function StatCard({
  label,
  value,
  icon,
  horizontal,
}: {
  label: string
  value: string
  icon: string
  horizontal?: boolean
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-[1.5rem] border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
      interactive
    >
      <div className="absolute inset-x-0 top-0 h-1" />
      <div className={cn('flex items-start justify-between gap-3', horizontal && 'items-center')}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-sm text-amber-100">
          {icon}
        </span>
        <div className={cn('min-w-0 flex-1', horizontal ? 'flex items-center justify-between gap-4' : '')}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
            <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-ase-text">{value}</div>
          </div>
          <div className="mt-2 h-2 w-2 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
        </div>
      </div>
    </Card>
  )
}
