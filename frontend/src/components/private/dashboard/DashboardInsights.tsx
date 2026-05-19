import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type InsightId = 'mostUsedProduct' | 'activeSubscriptions' | 'topOrg' | 'pendingInvites' | 'lastAnomaly'

const INSIGHTS: Array<{ id: InsightId; icon: string; tone: 'primary' | 'accent' | 'muted' }> = [
  { id: 'mostUsedProduct', icon: '◇', tone: 'primary' },
  { id: 'activeSubscriptions', icon: '◈', tone: 'accent' },
  { id: 'topOrg', icon: '⬡', tone: 'muted' },
  { id: 'pendingInvites', icon: '◉', tone: 'accent' },
  { id: 'lastAnomaly', icon: '○', tone: 'muted' },
]

export function DashboardInsights() {
  const { t } = useI18n()

  return (
    <section className="relative">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('dashboardPage.insights.badge')}
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('dashboardPage.insights.title')}</h2>
          <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('dashboardPage.insights.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {INSIGHTS.map((it) => (
          <Card
            key={it.id}
            interactive
            className={cn(
              'group relative overflow-hidden rounded-3xl border-white/[0.08] bg-ase-surface/40 p-4 backdrop-blur-md',
              'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.10),transparent_55%)]" />
            </div>

            <div className="relative z-[1] flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-ase-text">
                {it.icon}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t(`dashboardPage.insights.items.${it.id}.title`)}
                  </div>
                  <span
                    className={cn(
                      'mt-1 h-2 w-2 shrink-0 rounded-full',
                      it.tone === 'primary'
                        ? 'bg-ase-primary/80 shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                        : it.tone === 'accent'
                          ? 'bg-ase-accent/80 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                          : 'bg-white/25',
                    )}
                  />
                </div>

                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <div className="truncate text-xl font-extrabold tracking-tight text-ase-text">
                    {t(`dashboardPage.insights.items.${it.id}.value`)}
                  </div>
                  <div className="hidden h-1.5 w-16 rounded-full bg-white/10 sm:block">
                    <div className="h-1.5 w-[62%] rounded-full bg-gradient-to-r from-ase-primary/70 to-ase-accent/40" />
                  </div>
                </div>

                <div className="mt-1 line-clamp-2 text-xs text-ase-text2">{t(`dashboardPage.insights.items.${it.id}.hint`)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

