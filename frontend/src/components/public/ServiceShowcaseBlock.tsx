import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Service } from '../../types/service.types'
import { localizedServiceCopy } from '../../i18n/localizedService'
import { tStringArray, useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'

type Props = {
  service: Service
  reverse?: boolean
  categoryLabel: string
}

function TechPanel({ className }: { className?: string }) {
  const { t } = useI18n()
  const chips = tStringArray(t, 'servicesPage.visuals.showcaseChips')

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-ase-bg2/80 to-ase-bg/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.55)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ase-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-ase-accent/10 blur-3xl" />
      <div className="relative z-[1] space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
            {t('servicesPage.visuals.showcaseSignals')}
          </span>
          <span className="rounded-full border border-ase-primary/25 bg-ase-primary/10 px-3 py-1 text-[11px] font-semibold text-ase-primary">
            {t('servicesPage.visuals.showcaseLiveArchitecture')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {chips.map((label, i) => (
            <div
              key={`chip-${i}`}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center text-xs font-semibold text-ase-text2"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-ase-primary/20 bg-ase-primary/5 px-4 py-3 text-xs leading-relaxed text-ase-text2">
          {t('servicesPage.visuals.showcaseFootnote')}
        </div>
      </div>
    </div>
  )
}

export function ServiceShowcaseBlock({ service, reverse, categoryLabel }: Props) {
  const { t } = useI18n()
  const loc = useMemo(() => localizedServiceCopy(t, service), [t, service])

  const title = loc.heroTitle || service.name
  const subtitle = loc.heroSubtitle || service.hero_subtitle || service.short_description || ''
  const body = loc.description || service.description || ''

  const feats = loc.features
  const highs = loc.highlights

  return (
    <section className="relative scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="mx-auto w-full max-w-[min(100%,1400px)] px-5 sm:px-8 lg:px-12">
        <div
          className={cn(
            'flex flex-col items-stretch gap-12 lg:flex-row lg:items-center lg:gap-16',
            reverse ? 'lg:flex-row-reverse' : '',
          )}
        >
          <div className="w-full shrink-0 lg:w-[42%]">
            <TechPanel />
          </div>
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="border-white/10 bg-white/[0.04] text-xs text-ase-text2">
                {categoryLabel}
              </Badge>
              {service.is_featured ? (
                <Badge variant="info" className="border-ase-primary/30 bg-ase-primary/10 text-xs text-ase-primary">
                  {t('servicesPage.showcase.featuredLabel')}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-start gap-4">
              {service.icon ? (
                <span className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl text-ase-text">
                  {service.icon}
                </span>
              ) : null}
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl lg:text-[2.5rem] lg:leading-[1.08]">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg">{subtitle}</p>
                ) : null}
              </div>
            </div>
            {body ? (
              <p className="max-w-3xl text-sm leading-relaxed text-ase-text2 sm:text-base lg:text-[17px]">{body}</p>
            ) : null}

            {highs.length > 0 ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t('servicesPage.showcase.highlightsTitle')}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {highs.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 backdrop-blur-sm"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{h.title}</div>
                      <div className="mt-2 text-lg font-extrabold tracking-tight text-ase-text">{h.value}</div>
                      {h.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-ase-text2">{h.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {feats.length > 0 ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t('servicesPage.showcase.featuresTitle')}
                </div>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {feats.map((f) => (
                    <li
                      key={f.id}
                      className="flex gap-3 rounded-2xl border border-white/[0.06] bg-ase-bg2/40 px-4 py-3 text-sm text-ase-text2"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-accent/80 shadow-[0_0_12px_rgba(34,211,238,0.25)]" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Link to="/contact" className="sm:flex-initial">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('servicesPage.showcase.ctaTalk')}
                </Button>
              </Link>
              <Link to="/platform" className="sm:flex-initial">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t('servicesPage.showcase.ctaPlatform')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
