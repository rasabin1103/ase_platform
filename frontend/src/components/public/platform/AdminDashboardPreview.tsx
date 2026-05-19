import { useMemo } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type CardId = 'orgs' | 'users' | 'subs' | 'alerts'
const CARDS: CardId[] = ['orgs', 'users', 'subs', 'alerts']

export function AdminDashboardPreview() {
  const { t } = useI18n()
  const legend = useMemo(() => tStringArray(t, 'platformPage.dashboard.charts.legend'), [t])
  const headers = useMemo(() => tStringArray(t, 'platformPage.dashboard.table.headers'), [t])
  const rows = useMemo(() => t('platformPage.dashboard.table.rows') as string[][], [t])

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,211,238,0.08),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('platformPage.dashboard.badge')}
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('platformPage.dashboard.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.dashboard.subtitle')}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="relative z-[1] grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {CARDS.map((id) => (
                  <MetricCard key={id} id={id} />
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.dashboard.charts.title')}</div>
                  <div className="flex flex-wrap gap-2">
                    {legend.map((l, i) => (
                      <span
                        key={`leg-${i}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ase-muted"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Sparkline tone="primary" />
                  <Sparkline tone="accent" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <div className="border-b border-white/[0.08] px-5 py-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.dashboard.table.title')}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  <span>{headers[0] ?? ''}</span>
                  <span>{headers[1] ?? ''}</span>
                  <span className="text-right">{headers[2] ?? ''}</span>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {rows.map((r, i) => (
                    <div key={`trow-${i}`} className="grid grid-cols-3 gap-2 px-5 py-3 text-xs text-ase-text2">
                      <span className="truncate">{r[0]}</span>
                      <span className="truncate">{r[1]}</span>
                      <span className="text-right text-ase-muted">{r[2]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-ase-accent/20 bg-ase-accent/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.audit.indicators.title')}</div>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ase-accent shadow-[0_0_16px_rgba(34,211,238,0.35)]" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ase-text2">{t('platformPage.workflows.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ id }: { id: CardId }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ase-bg2/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t(`platformPage.dashboard.cards.${id}.title`)}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-ase-text">{t(`platformPage.dashboard.cards.${id}.value`)}</div>
      <div className="mt-1 text-xs text-ase-text2">{t(`platformPage.dashboard.cards.${id}.caption`)}</div>
    </div>
  )
}

function Sparkline({ tone }: { tone: 'primary' | 'accent' }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ase-bg2/35 p-4">
      <div className="flex items-center justify-between">
        <div className="h-2 w-16 rounded-full bg-white/10" />
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            tone === 'primary' ? 'bg-ase-primary/80 shadow-[0_0_12px_rgba(56,189,248,0.18)]' : 'bg-ase-accent/80',
          )}
        />
      </div>
      <div className="mt-4 flex items-end gap-1">
        {[18, 26, 14, 32, 24, 38, 20, 44, 28, 36].map((h, i) => (
          <div key={`bar-${i}`} className="w-full rounded-md bg-white/10">
            <div
              className={cn(
                'rounded-md',
                tone === 'primary' ? 'bg-gradient-to-t from-ase-primary/70 to-ase-accent/40' : 'bg-gradient-to-t from-ase-accent/70 to-ase-primary/30',
              )}
              style={{ height: `${h}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

