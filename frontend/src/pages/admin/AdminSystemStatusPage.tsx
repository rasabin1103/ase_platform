import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { getSystemStatus } from '../../api/adminDashboard.api'
import { getErrorLogsSummary } from '../../api/errorLogs.api'
import { getAccountLifecycleSummary, runAccountLifecycleSweep } from '../../api/accountLifecycle.api'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { PremiumOrb } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'

function fmtUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function StatusCard({
  label,
  hint,
  value,
  ok,
}: {
  label: string
  hint: string
  value: string
  ok: boolean
}) {
  return (
    <Card className="rounded-[1.75rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-2 text-sm text-ase-text2">{hint}</div>
        </div>
        <Badge variant={ok ? 'success' : 'error'}>{value}</Badge>
      </div>
    </Card>
  )
}

export function AdminSystemStatusPanel({ onViewErrors }: { onViewErrors?: () => void } = {}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['admin-system-status'],
    queryFn: getSystemStatus,
    refetchInterval: 30_000,
  })
  const data = query.data

  const errorsQuery = useQuery({
    queryKey: ['admin-error-logs-summary'],
    queryFn: getErrorLogsSummary,
    refetchInterval: 30_000,
  })
  const errors = errorsQuery.data

  const lifecycleQuery = useQuery({
    queryKey: ['admin-account-lifecycle-summary'],
    queryFn: getAccountLifecycleSummary,
    refetchInterval: 30_000,
  })
  const lifecycle = lifecycleQuery.data

  const sweepMutation = useMutation({
    mutationFn: runAccountLifecycleSweep,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-account-lifecycle-summary'] }),
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-ase-muted">
          {data ? `${t('adminSystemStatus.lastChecked')}: ${fmtDate(data.checked_at)}` : null}
        </div>
        <Button variant="secondary" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={query.isFetching ? 'mr-1.5 h-4 w-4 animate-spin' : 'mr-1.5 h-4 w-4'} strokeWidth={1.75} />
          {t('adminSystemStatus.refresh')}
        </Button>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-32 rounded-[1.75rem]" />
          <Skeleton className="h-32 rounded-[1.75rem]" />
          <Skeleton className="h-32 rounded-[1.75rem]" />
        </div>
      ) : query.isError || !data ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminSystemStatus.loadError')} actionLabel={t('adminSystemStatus.refresh')} onAction={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatusCard
              label={t('adminSystemStatus.cards.api')}
              hint={`${t('adminSystemStatus.cards.apiHint')}: ${fmtUptime(data.uptime_seconds)}`}
              value={data.api_status === 'ok' ? t('adminSystemStatus.status.ok') : t('adminSystemStatus.status.error')}
              ok={data.api_status === 'ok'}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.database')}
              hint={
                data.database.latency_ms != null
                  ? `${t('adminSystemStatus.cards.databaseHint')}: ${data.database.latency_ms}ms`
                  : (data.database.message ?? '—')
              }
              value={data.database.status === 'ok' ? t('adminSystemStatus.status.ok') : t('adminSystemStatus.status.error')}
              ok={data.database.status === 'ok'}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.githubIntegration')}
              hint={t('adminSystemStatus.cards.githubIntegrationHint')}
              value={data.github_integration_configured ? t('adminSystemStatus.status.configured') : t('adminSystemStatus.status.notConfigured')}
              ok={data.github_integration_configured}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.rateLimiting')}
              hint={t('adminSystemStatus.cards.rateLimitingHint')}
              value={data.rate_limiting_enabled ? t('adminSystemStatus.status.enabled') : t('adminSystemStatus.status.disabled')}
              ok={data.rate_limiting_enabled}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.smtp')}
              hint={t('adminSystemStatus.cards.smtpHint')}
              value={data.smtp_configured ? t('adminSystemStatus.status.configured') : t('adminSystemStatus.status.notConfigured')}
              ok={data.smtp_configured}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.sentry')}
              hint={t('adminSystemStatus.cards.sentryHint')}
              value={data.sentry_configured ? t('adminSystemStatus.status.configured') : t('adminSystemStatus.status.notConfigured')}
              ok={data.sentry_configured}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.redis')}
              hint={t('adminSystemStatus.cards.redisHint')}
              value={data.redis_configured ? t('adminSystemStatus.status.configured') : t('adminSystemStatus.status.notConfigured')}
              ok={data.redis_configured}
            />
            <StatusCard
              label={t('adminSystemStatus.cards.environment')}
              hint={t('adminSystemStatus.cards.mvpMode')}
              value={data.environment}
              ok
            />
            <StatusCard
              label={t('adminSystemStatus.cards.mvpMode')}
              hint={t('adminSystemStatus.cards.environment')}
              value={data.mvp_mode ? t('adminSystemStatus.status.enabled') : t('adminSystemStatus.status.disabled')}
              ok
            />
          </div>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminSystemStatus.counts.title')}</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <PremiumOrb label={t('adminSystemStatus.counts.users')} value={data.counts.users_total} tone="info" />
              <PremiumOrb label={t('adminSystemStatus.counts.catalog')} value={data.counts.catalog_total} tone="violet" />
              <PremiumOrb label={t('adminSystemStatus.counts.requestsPending')} value={data.counts.requests_pending} tone="warning" />
            </div>
          </Card>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminSystemStatus.adoption.title')}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PremiumOrb label={t('adminSystemStatus.adoption.emailVerified')} value={`${data.email_verified_pct}%`} tone="info" />
              <PremiumOrb label={t('adminSystemStatus.adoption.twoFactor')} value={`${data.two_factor_adoption_pct}%`} tone="violet" />
            </div>
          </Card>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminSystemStatus.errors.title')}</div>
              {onViewErrors && (
                <Button variant="secondary" size="sm" onClick={onViewErrors}>
                  {t('adminSystemStatus.errors.viewAll')}
                </Button>
              )}
            </div>
            {errors ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PremiumOrb label={t('adminSystemStatus.errors.last24h')} value={errors.last_24h} tone={errors.last_24h > 0 ? 'warning' : 'success'} />
                <PremiumOrb label={t('adminSystemStatus.errors.last7d')} value={errors.last_7d} tone={errors.last_7d > 0 ? 'warning' : 'success'} />
              </div>
            ) : (
              <Skeleton className="mt-4 h-16 rounded-xl" />
            )}
          </Card>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
                  {t('adminSystemStatus.lifecycle.title')}
                </span>
                {lifecycle && (
                  <Badge variant={lifecycle.enabled ? 'success' : 'default'}>
                    {lifecycle.enabled ? t('adminSystemStatus.status.enabled') : t('adminSystemStatus.status.disabled')}
                  </Badge>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={sweepMutation.isPending}
                onClick={() => sweepMutation.mutate()}
              >
                {sweepMutation.isPending ? t('adminSystemStatus.lifecycle.running') : t('adminSystemStatus.lifecycle.runNow')}
              </Button>
            </div>

            {lifecycle ? (
              <>
                <p className="mt-2 text-xs text-ase-muted">
                  {String(t('adminSystemStatus.lifecycle.policyHint'))
                    .replace('{{grace}}', String(lifecycle.two_factor_grace_days))
                    .replace('{{inactivity}}', String(lifecycle.inactivity_suspend_days))
                    .replace('{{delete}}', String(lifecycle.suspended_delete_days))}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <PremiumOrb
                    label={t('adminSystemStatus.lifecycle.pendingTwoFactor')}
                    value={lifecycle.pending_two_factor_activation}
                    tone="info"
                  />
                  <PremiumOrb
                    label={t('adminSystemStatus.lifecycle.suspendedTwoFactor')}
                    value={lifecycle.suspended_two_factor}
                    tone="warning"
                  />
                  <PremiumOrb
                    label={t('adminSystemStatus.lifecycle.suspendedInactivity')}
                    value={lifecycle.suspended_inactivity}
                    tone="warning"
                  />
                  <PremiumOrb
                    label={t('adminSystemStatus.lifecycle.pendingDeletion')}
                    value={lifecycle.pending_deletion_soon}
                    tone={lifecycle.pending_deletion_soon > 0 ? 'warning' : 'success'}
                  />
                </div>
              </>
            ) : (
              <Skeleton className="mt-4 h-16 rounded-xl" />
            )}

            {sweepMutation.isSuccess && (
              <p className="mt-3 text-xs text-ase-muted">
                {String(t('adminSystemStatus.lifecycle.sweepResult'))
                  .replace('{{suspended2fa}}', String(sweepMutation.data.suspended_two_factor))
                  .replace('{{suspendedInactivity}}', String(sweepMutation.data.suspended_inactivity))
                  .replace('{{deleted}}', String(sweepMutation.data.deleted))}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
