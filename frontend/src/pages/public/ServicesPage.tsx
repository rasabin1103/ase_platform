import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listPublicServices } from '../../api/services.api'
import { CapabilitiesMap } from '../../components/public/CapabilitiesMap'
import { ServiceBooksDigitalSection } from '../../components/public/ServiceBooksDigitalSection'
import { ServiceFrameworkEcosystem } from '../../components/public/ServiceFrameworkEcosystem'
import { ServiceShowcaseBlock } from '../../components/public/ServiceShowcaseBlock'
import { ServiceTrainingEcosystem } from '../../components/public/ServiceTrainingEcosystem'
import { ServicesHeroPremium } from '../../components/public/ServicesHeroPremium'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useI18n } from '../../i18n'
import type { ServiceCategory } from '../../types/service.types'

const PILLAR_CATEGORIES: ServiceCategory[] = ['platform_engineering', 'qa_automation', 'ai_automation']

function categoryLabel(t: (k: string) => string, cat: ServiceCategory): string {
  const key = `servicesPage.overview.categoryLabels.${cat}`
  const hit = t(key)
  return hit === key ? cat : hit
}

export function ServicesPage() {
  const { t } = useI18n()

  const servicesQuery = useQuery({
    queryKey: ['services', 'public'],
    queryFn: () => listPublicServices({ limit: 100, offset: 0 }),
    staleTime: 60_000,
  })

  const items = useMemo(() => {
    const raw = servicesQuery.data ?? []
    return [...raw].filter((s) => s.is_active).sort((a, b) => a.display_order - b.display_order)
  }, [servicesQuery.data])

  const pillars = useMemo(
    () => items.filter((s) => PILLAR_CATEGORIES.includes(s.category)),
    [items],
  )

  const frameworkService = useMemo(() => items.find((s) => s.code === 'premium_frameworks') ?? null, [items])
  const trainingService = useMemo(() => items.find((s) => s.code === 'technical_training') ?? null, [items])
  const booksService = useMemo(() => items.find((s) => s.code === 'technical_books_digital_assets') ?? null, [items])

  const categoryKeys = useMemo(() => {
    const set = new Set<ServiceCategory>()
    items.forEach((s) => set.add(s.category))
    return Array.from(set).sort()
  }, [items])

  return (
    <div className="min-h-screen bg-ase-bg">
      <ServicesHeroPremium />

      {servicesQuery.isError ? (
        <div className="mx-auto max-w-[min(100%,720px)] px-5 py-16 text-center sm:px-8">
          <Card className="border-ase-error/25 bg-ase-error/5 p-8">
            <p className="text-sm text-ase-text2">{t('servicesPage.states.error')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => servicesQuery.refetch()}>
              {t('servicesPage.states.retry')}
            </Button>
          </Card>
        </div>
      ) : null}

      {servicesQuery.isLoading ? (
        <div className="mx-auto max-w-[min(100%,1400px)] space-y-10 px-5 py-16 sm:px-8 lg:px-12">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/10" />
          <div className="h-40 w-full animate-pulse rounded-[2rem] bg-white/[0.06]" />
          <div className="h-96 w-full animate-pulse rounded-[2rem] bg-white/[0.05]" />
          <p className="sr-only">{t('servicesPage.states.loading')}</p>
        </div>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && items.length === 0 ? (
        <div className="mx-auto max-w-[min(100%,720px)] px-5 py-20 text-center sm:px-8">
          <Card className="border-white/10 bg-white/[0.02] p-10">
            <p className="text-sm text-ase-text2">{t('servicesPage.states.empty')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => servicesQuery.refetch()}>
              {t('servicesPage.states.retry')}
            </Button>
          </Card>
        </div>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && items.length > 0 ? (
        <>
          <section className="border-t border-white/[0.06] bg-ase-bg2/30 py-14 sm:py-20">
            <div className="mx-auto w-full max-w-[min(100%,1400px)] px-5 sm:px-8 lg:px-12">
              <div className="max-w-3xl">
                <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
                  {t('servicesPage.overview.badge')}
                </Badge>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
                  {t('servicesPage.overview.title')}
                </h2>
                <p className="mt-3 text-base text-ase-text2 sm:text-lg">{t('servicesPage.overview.subtitle')}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {categoryKeys.map((c) => (
                  <Badge key={c} variant="info" className="border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                    {categoryLabel(t, c)}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {pillars.map((svc, idx) => (
            <ServiceShowcaseBlock
              key={svc.uuid}
              service={svc}
              reverse={idx % 2 === 1}
              categoryLabel={categoryLabel(t, svc.category)}
            />
          ))}

          <CapabilitiesMap />

          <ServiceFrameworkEcosystem service={frameworkService} />

          <ServiceTrainingEcosystem service={trainingService} />

          <ServiceBooksDigitalSection service={booksService} />

          <section className="border-t border-white/[0.06] py-20 sm:py-28">
            <div className="mx-auto flex max-w-[min(100%,900px)] flex-col items-center px-5 text-center sm:px-8">
              <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
                {t('servicesPage.cta.badge')}
              </Badge>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
                {t('servicesPage.cta.title')}
              </h2>
              <p className="mt-4 max-w-2xl text-base text-ase-text2 sm:text-lg">{t('servicesPage.cta.subtitle')}</p>
              <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <Link to="/contact" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:min-w-[200px]">
                    {t('servicesPage.cta.primary')}
                  </Button>
                </Link>
                <Link to="/platform" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:min-w-[200px]">
                    {t('servicesPage.cta.secondary')}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
