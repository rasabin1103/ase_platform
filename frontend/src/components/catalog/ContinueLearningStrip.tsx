import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, History } from 'lucide-react'
import { listMyRecentlyOpened } from '../../api/consumerCatalog.api'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { Skeleton } from '../ui/Skeleton'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import type { CatalogItemType } from '../../types/catalog.types'

function typeLabelKey(type: CatalogItemType): string {
  const map: Record<CatalogItemType, string> = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  }
  return map[type]
}

/** "Continue where you left off" — the most recently opened owned items
 * (in-platform viewer, download, or an audiobook chapter; see
 * ConsumerCatalogService.list_recently_opened on the backend). Renders
 * nothing until the user has actually opened at least one resource, so a
 * brand-new account never sees an empty strip. */
export function ContinueLearningStrip() {
  const { t, language } = useI18n()

  const query = useQuery({
    queryKey: ['consumer-catalog', 'me', 'recent'],
    queryFn: () => listMyRecentlyOpened(6),
    staleTime: 30_000,
  })

  const items = query.data?.items ?? []

  if (!query.isLoading && items.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <History className="h-4 w-4 text-ase-brand" strokeWidth={1.75} />
        <Eyebrow>{t('independentDashboard.continueLearning.badge')}</Eyebrow>
      </div>
      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const title = localizedCatalogText(language, item.title, item.titleEn)
            const detailPath = `/catalog/${item.type}/${item.slug}`
            return (
              <Card key={item.slug} className="flex items-center gap-3 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ase-bg2">
                  <AuthenticatedImage src={item.imageUrl} alt="" fit="cover" className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                    {t(typeLabelKey(item.type))}
                  </p>
                  <h3 className="mt-0.5 truncate text-sm font-semibold text-ase-text">{title}</h3>
                </div>
                <Link to={detailPath} className="shrink-0">
                  <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />}>
                    {t('independentDashboard.continueLearning.cta')}
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
