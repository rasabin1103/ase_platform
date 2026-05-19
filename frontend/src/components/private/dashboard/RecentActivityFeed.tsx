import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type EventType = 'orgCreated' | 'roleAssigned' | 'subscriptionUpdated' | 'invitationAccepted' | 'productActivated' | 'auditEvent'

export function RecentActivityFeed() {
  const { t } = useI18n()

  const events = useMemo(
    () =>
      (t('dashboardPage.feed.mock') as Array<{ type: EventType; who: string; meta: string; at: string }>) ?? [],
    [t],
  )

  const isEmpty = events.length === 0

  return (
    <section className="relative">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('dashboardPage.feed.badge')}
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('dashboardPage.feed.title')}</h2>
          <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('dashboardPage.feed.subtitle')}</p>
        </div>
      </div>

      <Card
        interactive
        className={cn(
          'mt-6 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md sm:p-8',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
        )}
      >
        {isEmpty ? (
          <div className="text-center">
            <div className="text-lg font-extrabold text-ase-text">{t('dashboardPage.feed.empty.title')}</div>
            <div className="mt-2 text-sm text-ase-text2">{t('dashboardPage.feed.empty.body')}</div>
            <div className="mt-6 flex justify-center">
              <Link to="/organizations">
                <Button>{t('dashboardPage.feed.empty.cta')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <ol className="relative">
            <div className="pointer-events-none absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-ase-primary/50 via-white/10 to-transparent sm:left-4" />
            <div className="space-y-4 pl-10 sm:pl-12">
              {events.map((e, i) => (
                <li key={`ev-${i}`} className="group relative">
                  <div className="absolute -left-[1.05rem] top-4 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2 text-xs text-ase-text sm:-left-[1.25rem]">
                    {iconFor(e.type)}
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition group-hover:border-white/15 group-hover:bg-white/[0.06]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-ase-text">{t(`dashboardPage.feed.eventTypes.${e.type}`)}</div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{e.at}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ase-text2">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-semibold text-ase-text2">{e.who}</span>
                      <span className="text-ase-muted">·</span>
                      <span className="text-ase-text2">{e.meta}</span>
                    </div>
                  </div>
                </li>
              ))}
            </div>
          </ol>
        )}
      </Card>
    </section>
  )
}

function iconFor(type: EventType): string {
  switch (type) {
    case 'orgCreated':
      return '⬡'
    case 'roleAssigned':
      return '▣'
    case 'subscriptionUpdated':
      return '◈'
    case 'invitationAccepted':
      return '◉'
    case 'productActivated':
      return '◇'
    case 'auditEvent':
      return '○'
  }
}

