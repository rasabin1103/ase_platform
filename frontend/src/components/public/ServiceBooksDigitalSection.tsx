import { useMemo } from 'react'
import type { Service } from '../../types/service.types'
import { localizedServiceCopy } from '../../i18n/localizedService'
import { useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'

const GRID_KEYS = ['python', 'sql', 'qa', 'automation', 'guides', 'templates'] as const
const SPINE_KEYS = ['guides', 'pdfs', 'templates', 'checklists', 'labs', 'bundles'] as const

type Props = {
  service?: Service | null
}

export function ServiceBooksDigitalSection({ service }: Props) {
  const { t } = useI18n()

  const loc = useMemo(() => (service ? localizedServiceCopy(t, service) : null), [t, service])
  const coverTitle = loc?.name || service?.name || (t('servicesPage.books.cover.titleFallback') as string)
  const coverBody = loc?.shortDescription || service?.short_description || (t('servicesPage.books.cover.bodyFallback') as string)

  const spineLabels = useMemo(
    () => SPINE_KEYS.map((k) => t(`servicesPage.books.spine.${k}`) as string),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-ase-primary/10 blur-3xl" />
      <div className="relative mx-auto w-full max-w-[min(100%,1400px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Badge variant="info" className="border-white/10 bg-white/[0.04]">
            {t('servicesPage.books.badge')}
          </Badge>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('servicesPage.books.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('servicesPage.books.subtitle')}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-ase-primary/15 via-transparent to-ase-accent/10 blur-2xl" />
              <div className="relative aspect-[3/4] rounded-[2rem] border border-white/10 bg-gradient-to-br from-ase-surface via-ase-bg2 to-ase-bg p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-ase-muted">
                  <span>{t('servicesPage.books.cover.brandLeft')}</span>
                  <span>{t('servicesPage.books.cover.brandRight')}</span>
                </div>
                <div className="mt-8 text-2xl font-extrabold leading-snug text-ase-text sm:text-3xl">{coverTitle}</div>
                <div className="mt-3 h-1 w-16 rounded-full bg-ase-primary/60" />
                <p className="mt-6 text-sm leading-relaxed text-ase-text2">{coverBody}</p>
                <div className="mt-8 space-y-2">
                  {spineLabels.map((s, i) => (
                    <div
                      key={`spine-${i}`}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-ase-text2"
                    >
                      <span>{s}</span>
                      <span className="text-ase-muted">{t('servicesPage.visuals.booksSpineMore')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {GRID_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t(`servicesPage.books.items.${key}.tag`)}
                </div>
                <div className="mt-2 text-lg font-extrabold text-ase-text">{t('servicesPage.books.moduleTitle')}</div>
                <p className="mt-2 text-sm leading-relaxed text-ase-text2">{t('servicesPage.books.moduleBody')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-ase-primary/25 bg-ase-primary/10 px-2 py-0.5 text-[10px] font-semibold text-ase-primary">
                    {t('servicesPage.books.labels.pdf')}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-ase-text2">
                    {t('servicesPage.books.labels.workbook')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
