import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Layers, Sparkles } from 'lucide-react'
import { getCatalogItemSeries } from '../../api/consumerCatalog.api'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

type Props = {
  slug: string
  currentSlug: string
}

/** Shows "you're N/M through this series" plus a recommended next item —
 * only rendered when the current item has a seriesName (see
 * CatalogDetailPage). Silently renders nothing on error/empty rather than
 * an error state: this is a nice-to-have next to the main purchase flow,
 * not something that should ever block the page. */
export function SeriesPanel({ slug, currentSlug }: Props) {
  const { t, language } = useI18n()
  const query = useQuery({
    queryKey: ['consumer-catalog', slug, 'series'],
    queryFn: () => getCatalogItemSeries(slug),
  })

  if (query.isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }
  if (query.isError || !query.data || query.data.items.length < 2) {
    // A "series" of one (or a fetch failure) has nothing useful to show —
    // no progress bar, no recommendation.
    return null
  }

  const { seriesName, items, ownedCount, totalCount, nextItem } = query.data
  const pct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <Layers className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
          {t('catalog.series.title')}: {seriesName}
        </h2>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ase-muted">
          <span>
            {String(t('catalog.series.progress'))
              .replace('{{owned}}', String(ownedCount))
              .replace('{{total}}', String(totalCount))}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-ase-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {items.map((it) => {
          const isCurrent = it.slug === currentSlug
          const itemTitle = localizedCatalogText(language, it.title, it.titleEn)
          return (
            <li key={it.slug}>
              <Link
                to={`/catalog/${it.type}/${it.slug}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition',
                  isCurrent ? 'bg-ase-brand/10 text-ase-text' : 'text-ase-text2 hover:bg-white/[0.04] hover:text-ase-text',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                    it.isPurchased
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                      : 'border-white/15 text-ase-muted',
                  )}
                >
                  {it.isPurchased ? <Check className="h-3 w-3" strokeWidth={2.5} /> : (it.seriesOrder ?? '·')}
                </span>
                <span className={cn('truncate', isCurrent && 'font-semibold')}>{itemTitle}</span>
                {isCurrent ? (
                  <span className="ml-auto shrink-0 text-[11px] text-ase-muted">{t('catalog.series.current')}</span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>

      {nextItem && nextItem.slug !== currentSlug ? (
        // Made deliberately louder than the plain list above it — a
        // bordered, tinted callout with an icon and a primary (not
        // secondary) button — since this is the one actionable thing this
        // panel wants the buyer to notice: which single item completes
        // their series. The muted-text + secondary-button treatment this
        // replaced was easy to miss below the series list.
        <div className="mt-4 rounded-xl border border-ase-brand/25 bg-ase-brand/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ase-brand">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t('catalog.series.recommendedNext')}
          </p>
          <Link to={`/catalog/${nextItem.type}/${nextItem.slug}`} className="mt-2 block">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />}>
              {localizedCatalogText(language, nextItem.title, nextItem.titleEn)}
            </Button>
          </Link>
        </div>
      ) : ownedCount === totalCount ? (
        <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-emerald-300">
          {t('catalog.series.complete')}
        </p>
      ) : null}
    </Card>
  )
}
