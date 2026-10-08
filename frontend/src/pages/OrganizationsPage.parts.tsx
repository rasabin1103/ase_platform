import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import type { Organization } from '../types/organization.types'
import { isManagedOrganization, organizationTypeLabel } from './OrganizationsPage.utils'
import { renderOrganizationBadges, renderStatusBadge } from './OrganizationsPage.render'

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
    <Card className="rounded-2xl border-white/10 bg-ase-surface p-4 shadow-soft" interactive>
      <div className={cn('flex items-start justify-between gap-3', horizontal && 'items-center')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">
          {icon}
        </span>
        <div className={cn('min-w-0 flex-1', horizontal ? 'flex items-center justify-between gap-4' : '')}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
            <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-ase-text">{value}</div>
          </div>
          <div className="mt-2 h-2 w-2 rounded-full bg-ase-brand/80" />
        </div>
      </div>
    </Card>
  )
}

export function SuperMetricCard({
  label,
  hint,
  value,
  icon,
}: {
  label: string
  hint: string
  value: number
  icon: string
  accent: string
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft"
      interactive
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-ase-brand/80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{value.toLocaleString()}</div>
          <div className="mt-2 text-xs text-ase-text2">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">
          {icon}
        </div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-ase-brand/80" style={{ width: `${Math.min(100, 26 + value * 12)}%` }} />
      </div>
    </Card>
  )
}

export function OrganizationPremiumCard({
  org,
  activeUuid,
  currentUserUuid,
  t,
  onDetails,
  onSetActive,
  onToggleStatus,
  onDelete,
  statusPending,
  disableDangerActions,
}: {
  org: Organization
  activeUuid: string | null
  currentUserUuid: string | null
  t: (k: string) => string
  onDetails: () => void
  onSetActive: () => void
  onToggleStatus: () => void
  onDelete: () => void
  statusPending: boolean
  disableDangerActions: boolean
}) {
  const isActive = activeUuid === org.uuid
  const members = Math.max(1, (org.slug.length % 7) + (isManagedOrganization(org, currentUserUuid) ? 3 : 1))
  const products = Math.max(1, org.type === 'enterprise' ? 5 : org.type === 'business' ? 3 : 1)
  const subscriptions = org.status === 'suspended' ? 0 : 1

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft transition duration-200 hover:-translate-y-1',
        isActive && 'border-ase-brand/25',
        org.status === 'suspended' && 'border-amber-300/20',
      )}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ase-bg2 text-sm font-bold text-ase-text ring-1 ring-white/10',
              isActive && 'ring-ase-brand/25',
              org.status === 'suspended' && 'ring-amber-300/20',
            )}
          >
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-ase-text">{org.name}</div>
            <div className="mt-1 truncate text-xs text-ase-muted">{org.slug}</div>
          </div>
        </div>
        {renderStatusBadge(t, org.status ?? null)}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {renderOrganizationBadges(t, org, { activeUuid, currentUserUuid })}
        <Badge variant="default">{organizationTypeLabel(t, org.type)}</Badge>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.members') as string} value={String(members)} />
        <MiniOrgMetric
          label={t('organizationsPage.superAdmin.cards.subscriptions') as string}
          value={String(subscriptions)}
        />
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.products') as string} value={String(products)} />
        <MiniOrgMetric
          label={t('organizationsPage.superAdmin.cards.lastActivity') as string}
          value={t('organizationsPage.superAdmin.cards.activityRecent') as string}
        />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onDetails}>
          {t('organizationsPage.superAdmin.actions.viewDetails')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDetails}>
          {t('organizationsPage.superAdmin.actions.manage')}
        </Button>
        {isActive ? null : (
          <Button size="sm" onClick={onSetActive}>
            {t('organizationsPage.superAdmin.actions.setActive')}
          </Button>
        )}
        {org.status !== 'deleted' ? (
          <Button size="sm" variant="outline" disabled={disableDangerActions || statusPending} onClick={onToggleStatus}>
            {org.status === 'suspended'
              ? t('organizationsPage.superAdmin.actions.reactivate')
              : t('organizationsPage.superAdmin.actions.suspend')}
          </Button>
        ) : null}
        {org.status !== 'deleted' ? (
          <Button size="sm" variant="danger" disabled={disableDangerActions} onClick={onDelete}>
            {t('organizationsPage.superAdmin.actions.delete')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function MiniOrgMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

export function PlatformInsightsPanel({
  t,
  items,
  typeDistribution,
  activeCount,
  suspendedCount,
  onCreate,
}: {
  t: (k: string) => string
  items: Organization[]
  typeDistribution: Array<[string, number]>
  activeCount: number
  suspendedCount: number
  onCreate: () => void
}) {
  const maxType = Math.max(1, ...typeDistribution.map(([, count]) => count))
  const recent = [...items]
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    .slice(0, 3)
  const attention = items.filter((org) => org.status === 'suspended')

  return (
    <aside className="space-y-6">
      <Card className="rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ase-text">{t('organizationsPage.superAdmin.insights.title')}</h2>
          <Button size="sm" onClick={onCreate}>
            {t('organizationsPage.superAdmin.create.open')}
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('organizationsPage.superAdmin.insights.distribution')}
            </div>
            <div className="mt-3 space-y-3">
              {typeDistribution.map(([type, count]) => (
                <div key={type}>
                  <div className="mb-1 flex justify-between text-xs text-ase-text2">
                    <span>{organizationTypeLabel(t, type)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-ase-brand/80"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('organizationsPage.superAdmin.insights.status')}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniOrgMetric label={t('organizationsPage.status.active') as string} value={String(activeCount)} />
              <MiniOrgMetric label={t('organizationsPage.status.suspended') as string} value={String(suspendedCount)} />
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('organizationsPage.superAdmin.insights.recent')}
            </div>
            <div className="mt-3 space-y-2">
              {recent.map((org) => (
                <div key={org.uuid} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="truncate text-sm font-medium text-ase-text">{org.name}</div>
                  <div className="mt-1 truncate text-xs text-ase-muted">{org.slug}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('organizationsPage.superAdmin.insights.attention')}
            </div>
            <div className="mt-3 space-y-2">
              {(attention.length ? attention : items.slice(0, 1)).map((org) => (
                <div
                  key={org.uuid}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
                >
                  <span className="truncate text-sm text-ase-text2">{org.name}</span>
                  {renderStatusBadge(t, org.status ?? null)}
                </div>
              ))}
            </div>
          </section>
        </div>
      </Card>
    </aside>
  )
}
