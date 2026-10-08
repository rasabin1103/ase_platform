import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Eye, LayoutGrid, List as ListIcon, Search } from 'lucide-react'
import {
  catalogShowcaseItemPath,
  listCatalogShowcaseCategories,
  listCatalogShowcaseItems,
  listCatalogShowcaseTags,
} from '../../api/catalogShowcase.api'
import type { CatalogItemType, CatalogShowcaseItem, CatalogShowcaseSort } from '../../api/catalogShowcase.api'
import { PageHero } from '../../components/public/home/PageHero'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { CatalogShowcasePreviewModal } from '../../components/catalog/CatalogShowcasePreviewModal'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { cn } from '../../components/ui/cn'
import { RatingSummary } from '../../components/catalog/RatingSummary'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import { ExpandableDescription } from '../../components/catalog/ExpandableDescription'

type ViewMode = 'grid' | 'list'

const SORT_OPTIONS: CatalogShowcaseSort[] = ['newest', 'top_rated', 'price_asc', 'price_desc']
const TYPE_TABS: CatalogItemType[] = ['course', 'book', 'product', 'resource']

function formatPrice(price: string, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(n)
}

export function CatalogShowcasePage() {
  const { t, language } = useI18n()
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sort, setSort] = useState<CatalogShowcaseSort>('newest')
  const [type, setType] = useState<CatalogItemType | undefined>(undefined)
  const v2 = (language === 'en' ? pagesV2En : pagesV2Es).catalog
  // Single shared modal for the whole grid/list rather than one per card —
  // cards just report which item to preview, the page owns the fetch.
  const [previewItem, setPreviewItem] = useState<CatalogShowcaseItem | null>(null)
  // Tarjeta con la descripción desplegada: se ensancha y se destaca, y el resto se atenúa.
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  useEffect(() => {
    if (!expandedSlug) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpandedSlug(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expandedSlug])

  const queryKey = useMemo(
    () => ['catalog-showcase', search, category, tagFilter, sort, type],
    [search, category, tagFilter, sort, type],
  )

  const query = useQuery({
    queryKey,
    queryFn: () =>
      listCatalogShowcaseItems({
        limit: 48,
        search: search.trim() || undefined,
        category,
        tags: tagFilter.length ? tagFilter : undefined,
        sort,
        type,
      }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['catalog-showcase-categories'],
    queryFn: listCatalogShowcaseCategories,
  })
  const tagsQuery = useQuery({
    queryKey: ['catalog-showcase-tags'],
    queryFn: listCatalogShowcaseTags,
  })

  // Recuento real por tipo para las pestañas (limit 1: solo interesa `total`).
  const typeCounts = useQueries({
    queries: TYPE_TABS.map((ty) => ({
      queryKey: ['catalog-showcase-count', ty],
      queryFn: () => listCatalogShowcaseItems({ type: ty, limit: 1 }),
      staleTime: 5 * 60_000,
    })),
  })
  const countFor = (i: number) => typeCounts[i]?.data?.total
  const totalCount = typeCounts.every((q) => q.isSuccess)
    ? typeCounts.reduce((n, q) => n + (q.data?.total ?? 0), 0)
    : undefined

  const items = query.data?.items ?? []
  const hasActiveFilters = Boolean(search.trim() || category || tagFilter.length || type)

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PageHero
        eyebrow={v2.eyebrow}
        titleBefore={v2.titleBefore}
        titleHighlight={v2.titleHighlight}
        titleAfter={v2.titleAfter}
        subtitle={v2.subtitle}
        align="left"
        compact
      >
        {/* Pestañas por tipo con recuento real */}
        <div role="tablist" aria-label={v2.eyebrow} className="flex flex-wrap gap-2">
          {[undefined, ...TYPE_TABS].map((ty, i) => {
            const active = type === ty
            const count = ty ? countFor(i - 1) : totalCount
            if (ty && count === 0) return null
            return (
              <button
                key={ty ?? 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setType(ty)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                  active
                    ? 'bg-ase-brand/20 text-ase-text ring-1 ring-ase-brand/50'
                    : 'border border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:text-ase-text',
                )}
              >
                {ty ? t(`publicCatalogShowcase.type.${ty}`) : v2.all}
                {count != null && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                      active ? 'bg-ase-brand/30 text-white' : 'bg-white/[0.06] text-ase-muted',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PageHero>

      <div className="mx-auto w-full max-w-[1400px] px-5 pb-24 sm:px-8">
        <div className="sticky top-16 z-20 -mx-2 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ase-bg/95 p-2.5 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.9)]">
          <label className="relative w-full max-w-md flex-1">
            <span className="sr-only">{v2.searchLabel}</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('publicCatalogShowcase.searchPlaceholder')}
              className="w-full rounded-xl border border-white/10 bg-ase-surface py-2.5 pl-10 pr-4 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
            />
          </label>

          <select
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm text-ase-text2 outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
          >
            <option value="">{t('publicCatalogShowcase.filters.allCategories')}</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogShowcaseSort)}
            className="rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm text-ase-text2 outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
            aria-label={t('publicCatalogShowcase.sort.label')}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`publicCatalogShowcase.sort.${s}`)}
              </option>
            ))}
          </select>

          <div className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              aria-label={t('publicCatalogShowcase.view.grid')}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-lg transition',
                view === 'grid' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
              )}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              aria-label={t('publicCatalogShowcase.view.list')}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-lg transition',
                view === 'list' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
              )}
            >
              <ListIcon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <TagFilterBar
            tags={tagsQuery.data ?? []}
            selected={tagFilter}
            onToggle={(tg) =>
              setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))
            }
            onClear={() => setTagFilter([])}
            label={t('publicCatalogShowcase.filters.tags')}
            clearLabel={t('publicCatalogShowcase.filters.clearTags')}
          />
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <EmptyState title={t('publicCatalogShowcase.loadError')} />
          ) : items.length === 0 ? (
            <EmptyState
              title={t('publicCatalogShowcase.empty')}
              description={hasActiveFilters ? t('publicCatalogShowcase.emptyHint') : undefined}
            />
          ) : view === 'grid' ? (
            <div className="grid grid-flow-row-dense gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <ShowcaseCard
                  key={item.slug}
                  item={item}
                  language={language}
                  t={t}
                  onPreview={() => setPreviewItem(item)}
                  expanded={expandedSlug === item.slug}
                  dimmed={!!expandedSlug && expandedSlug !== item.slug}
                  onExpandedChange={(open) => setExpandedSlug(open ? item.slug : null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <ShowcaseListRow
                  key={item.slug}
                  item={item}
                  language={language}
                  t={t}
                  onPreview={() => setPreviewItem(item)}
                  expanded={expandedSlug === item.slug}
                  dimmed={!!expandedSlug && expandedSlug !== item.slug}
                  onExpandedChange={(open) => setExpandedSlug(open ? item.slug : null)}
                />
              ))}
            </div>
          )}
        </div>

        {previewItem ? (
          <CatalogShowcasePreviewModal
            open
            onClose={() => setPreviewItem(null)}
            itemType={previewItem.type}
            slug={previewItem.slug}
            title={localizedCatalogText(language, previewItem.title, previewItem.titleEn)}
          />
        ) : null}
      </div>
    </div>
  )
}

type CardProps = {
  item: CatalogShowcaseItem
  language: 'en' | 'es'
  t: <T = string>(key: string) => T
  onPreview: () => void
  expanded: boolean
  dimmed: boolean
  onExpandedChange: (open: boolean) => void
}

/** Envoltorio que destaca la tarjeta desplegada (y la trae a la vista) y atenúa las demás. */
function FocusFrame({
  expanded,
  dimmed,
  wideClassName,
  children,
}: {
  expanded: boolean
  dimmed: boolean
  wideClassName?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [expanded])
  return (
    <div
      ref={ref}
      className={cn(
        'h-full rounded-xl transition-all duration-300 ease-out',
        expanded && cn('relative z-10 shadow-2xl shadow-cyan-500/10 ring-2 ring-cyan-400/60', wideClassName),
        dimmed && 'scale-[0.97] opacity-50 hover:opacity-90',
      )}
    >
      {children}
    </div>
  )
}

function ShowcaseCard({ item, language, t, onPreview, expanded, dimmed, onExpandedChange }: CardProps) {
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const description = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)
  const longDescription = localizedCatalogText(language, item.longDescription, item.longDescriptionEn)
  const detailPath = catalogShowcaseItemPath(item)

  return (
    <FocusFrame expanded={expanded} dimmed={dimmed} wideClassName="sm:col-span-2">
      <Card className="group flex h-full flex-col overflow-hidden p-0" interactive>
        <Link to={detailPath} className="flex flex-col">
          <div
            className={cn(
              'relative overflow-hidden bg-ase-bg2',
              catalogImageAspectClass(item.type),
              // Al ensancharse, la imagen mantiene una altura contenida para que la tarjeta no crezca de más.
              expanded && 'sm:aspect-auto sm:h-64',
            )}
          >
            <AuthenticatedImage
              src={item.imageUrl}
              alt=""
              fit="contain"
              className="h-full w-full transition duration-500 ease-out group-hover:scale-[1.08]"
            />
            <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text">
              {t(`publicCatalogShowcase.type.${item.type}`)}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 p-4 pb-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
              <h3 className="mt-1 text-base font-bold text-ase-text line-clamp-2">{title}</h3>
              <p className="mt-1.5 text-sm text-ase-muted">{description}</p>
            </div>
          </div>
        </Link>
        <div className="flex flex-col gap-2.5 px-4 pt-2.5">
          <ExpandableDescription
            markdown={longDescription}
            skipIfStartsWith={description}
            readMore={t('publicCatalogShowcase.readMore')}
            readLess={t('publicCatalogShowcase.readLess')}
            open={expanded}
            onOpenChange={onExpandedChange}
          />
          <Link to={detailPath} className="flex flex-col gap-1.5">
            <RatingSummary average={item.averageRating} count={item.reviewCount} />
            <p className="text-lg font-bold text-ase-text">
              {formatPrice(item.price, item.currency, t('publicCatalogShowcase.free'))}
            </p>
          </Link>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 p-4 pt-3">
          <ButtonLink to={detailPath} size="sm" variant="primary" className="min-w-0 flex-1">
            {t('publicCatalogShowcase.viewDetails')}
          </ButtonLink>
          {item.hasPreview ? (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
              onClick={onPreview}
            >
              {t('publicCatalogShowcase.preview')}
            </Button>
          ) : null}
        </div>
      </Card>
    </FocusFrame>
  )
}

function ShowcaseListRow({ item, language, t, onPreview, expanded, dimmed, onExpandedChange }: CardProps) {
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const description = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)
  const longDescription = localizedCatalogText(language, item.longDescription, item.longDescriptionEn)
  const detailPath = catalogShowcaseItemPath(item)

  return (
    <FocusFrame expanded={expanded} dimmed={dimmed}>
      <Card className="overflow-hidden p-0" interactive>
        <div className="flex w-full items-center gap-4">
          <Link to={detailPath} className="h-24 w-24 shrink-0 overflow-hidden bg-ase-bg2 sm:h-28 sm:w-28">
            <AuthenticatedImage src={item.imageUrl} alt="" fit="contain" className="h-full w-full" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1 py-3">
            <Link to={detailPath} className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-semibold text-ase-text2">
                  {t(`publicCatalogShowcase.type.${item.type}`)}
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
              </div>
              <h3 className="truncate text-base font-bold text-ase-text">{title}</h3>
              <p className="text-sm text-ase-muted">{description}</p>
              <RatingSummary average={item.averageRating} count={item.reviewCount} className="mt-0.5" />
            </Link>
            <ExpandableDescription
              markdown={longDescription}
              skipIfStartsWith={description}
              readMore={t('publicCatalogShowcase.readMore')}
              readLess={t('publicCatalogShowcase.readLess')}
              lines={2}
              open={expanded}
              onOpenChange={onExpandedChange}
            />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 py-3 pr-4">
            <p className="text-base font-bold text-ase-text">
              {formatPrice(item.price, item.currency, t('publicCatalogShowcase.free'))}
            </p>
            <div className="flex items-center gap-2">
              {item.hasPreview ? (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  onClick={onPreview}
                >
                  {t('publicCatalogShowcase.preview')}
                </Button>
              ) : null}
              <ButtonLink to={detailPath} size="sm" variant="primary">
                {t('publicCatalogShowcase.viewDetails')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>
    </FocusFrame>
  )
}
