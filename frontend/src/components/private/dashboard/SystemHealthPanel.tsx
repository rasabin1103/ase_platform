import { useMemo } from 'react'
import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type ServiceId = 'auth' | 'rbac' | 'billing' | 'audit' | 'notifications' | 'gateway'

const SERVICES: Array<{ id: ServiceId; tone: 'primary' | 'accent' | 'muted' }> = [
  { id: 'auth', tone: 'primary' },
  { id: 'rbac', tone: 'accent' },
  { id: 'billing', tone: 'muted' },
  { id: 'audit', tone: 'muted' },
  { id: 'notifications', tone: 'accent' },
  { id: 'gateway', tone: 'primary' },
]

export function SystemHealthPanel() {
  const { t } = useI18n()
  const ms = t('dashboardPage.units.ms') as string

  const rows = useMemo(() => {
    const base = 17
    return SERVICES.map((s, idx) => {
      const latency = 40 + ((idx * 17 + base) % 60)
      const uptime = 99.2 + (((idx * 13 + base) % 8) / 10)
      const events = 120 + ((idx * 19 + base) % 60)
      const status: 'ok' | 'degraded' = idx === 2 ? 'degraded' : 'ok'
      return { ...s, latency, uptime, events, status }
    })
  }, [])

  return (
    <section className="relative">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('dashboardPage.health.badge')}
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('dashboardPage.health.title')}</h2>
          <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('dashboardPage.health.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Card
            key={r.id}
            interactive
            className={cn(
              'group relative overflow-hidden rounded-3xl border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md',
              'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.10),transparent_55%)]" />
            </div>
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ase-text">{t(`dashboardPage.health.services.${r.id}`)}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t(r.status === 'ok' ? 'dashboardPage.health.labels.ok' : 'dashboardPage.health.labels.degraded')}
                </div>
              </div>
              <span
                className={cn(
                  'mt-1 h-2.5 w-2.5 rounded-full',
                  r.status === 'ok'
                    ? 'bg-ase-success/80 shadow-[0_0_18px_rgba(34,197,94,0.18)]'
                    : 'bg-ase-warning/80 shadow-[0_0_18px_rgba(245,158,11,0.16)]',
                )}
              />
            </div>

            <div className="relative z-[1] mt-5 grid grid-cols-3 gap-3">
              <Mini label={t('dashboardPage.health.labels.uptime') as string} value={`${r.uptime.toFixed(1)}%`} />
              <Mini label={t('dashboardPage.health.labels.latency') as string} value={`${r.latency}${ms}`} />
              <Mini label={t('dashboardPage.health.labels.events') as string} value={`${r.events}`} />
            </div>

            <div className="relative z-[1] mt-5 h-1.5 w-full rounded-full bg-white/10">
              <div
                className={cn(
                  'h-1.5 rounded-full',
                  r.status === 'ok'
                    ? 'w-[86%] bg-gradient-to-r from-ase-primary/70 to-ase-accent/40'
                    : 'w-[62%] bg-gradient-to-r from-ase-warning/70 to-ase-accent/20',
                )}
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 text-xs font-semibold text-ase-text2">{value}</div>
    </div>
  )
}

