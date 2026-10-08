import { useMemo, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Download, GraduationCap, Heart, Package, Search, Star } from 'lucide-react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  listConsumerCatalog,
  listConsumerCatalogTags,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { PremiumHero } from '../../components/admin/premium/PremiumHero'
import { CatalogItemCard } from '../../components/catalog/CatalogItemCard'
import { cn } from '../../components/ui/cn'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

const PAGE_SIZE = 24

const TYPE_ORDER: CatalogItemType[] = ['product', 'course', 'book', 'resource']

// Where each type's own catalog page lives — used to send someone from an
// empty type-specific catalog (e.g. no products published yet) to whichever
// catalog actually has content, instead of leaving them at a dead end.
const TYPE_CATALOG_PATH: Record<CatalogItemType, string> = {
  product: '/catalog/products',
  course: '/catalog/courses',
  book: '/catalog/books',
  resource: '/catalog/resources',
}

// Which catalog to suggest from each type's empty state — resources is the
// one catalog reliably stocked today, so product/course/book all point
// there; resource's own (currently hypothetical) empty state points back
// at products instead of suggesting itself. Matches the "cta" copy in
// catalog.emptyByType.*.
const EMPTY_STATE_SUGGESTION: Record<CatalogItemType, CatalogItemType> = {
  product: 'resource',
  course: 'resource',
  book: 'resource',
  resource: 'product',
}

const TYPE_META: Record<CatalogItemType, { Icon: typeof Package; accent: 'cyan' | 'violet' | 'amber' | 'emerald' }> = {
  product: { Icon: Package, accent: 'cyan' },
  course: { Icon: GraduationCap, accent: 'violet' },
  book: { Icon: BookOpen, accent: 'amber' },
  resource: { Icon: Download, accent: 'emerald' },
}

const HEADER_COPY = {
  es: {
    catalogBadge: 'Catálogo ASE',
    libraryBadge: 'Tu biblioteca',
    switcher: 'Cambiar de catálogo',
    results: (n: number) => (n === 1 ? '1 elemento' : `${n} elementos`),
    loadMore: 'Cargar más',
    showing: (a: number, b: number) => `Mostrando ${a} de ${b}`,
  },
  en: {
    catalogBadge: 'ASE catalog',
    libraryBadge: 'Your library',
    switcher: 'Switch catalog',
    results: (n: number) => (n === 1 ? '1 item' : `${n} items`),
    loadMore: 'Load more',
    showing: (a: number, b: number) => `Showing ${a} of ${b}`,
  },
} as const

function groupByType(items: CatalogItem[]): Array<[CatalogItemType, CatalogItem[]]> {
  const groups = new Map<CatalogItemType, CatalogItem[]>()
  for (const item of items) {
    const list = groups.get(item.type) ?? []
    list.push(item)
    groups.set(item.type, list)
  }
  return TYPE_ORDER.filter((t) => groups.has(t)).map((t) => [t, groups.get(t)!])
}

type Mode = 'type' | 'favorites' | 'purchases' | 'myProducts' | 'myCourses' | 'myBooks' | 'myResources'

type Props = {
  type?: CatalogItemType
  mode?: Mode
  titleKey?: string
  subtitleKey?: string
  catalogBasePath: string
  /** Hides the built-in "<h1>/<p>" header block — used when an enclosing
   * page (e.g. MyLibraryPage's tab switcher) already renders its own title
   * and just wants this component's filters/grid/empty-states. */
  hideHeader?: boolean
}

export function CatalogListPage({ type, mode = 'type', titleKey, subtitleKey, catalogBasePath, hideHeader }: Props) {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const qc = useQueryClient()
  // Los filtros viven en la URL (?q=, ?tags=, ?top=1) para que se conserven al
  // entrar en una ficha y volver atrás, y para poder compartir un enlace filtrado.
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const topRated = searchParams.get('top') === '1'
  const tagsParam = searchParams.get('tags') ?? ''
  const tagFilter = useMemo(() => (tagsParam ? tagsParam.split(',').filter(Boolean) : []), [tagsParam])
  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true },
    )
  }
  const setSearch = (v: string) => updateParams({ q: v || null })
  const setTopRated = (fn: (v: boolean) => boolean) => updateParams({ top: fn(topRated) ? '1' : null })
  const setTagFilter = (fn: (prev: string[]) => string[]) => {
    const next = fn(tagFilter)
    updateParams({ tags: next.length ? next.join(',') : null })
  }
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  const queryKey = useMemo(
    () => ['consumer-catalog', 'list', mode, type, search, topRated, tagFilter],
    [mode, type, search, topRated, tagFilter],
  )

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listConsumerCatalog({
        limit: PAGE_SIZE,
        offset: pageParam,
        type:
          mode === 'type'
            ? type
            : mode === 'myProducts'
              ? 'product'
              : mode === 'myCourses'
                ? 'course'
                : mode === 'myBooks'
                  ? 'book'
                  : mode === 'myResources'
                    ? 'resource'
                    : undefined,
        search: search.trim() || undefined,
        tags: tagFilter.length ? tagFilter : undefined,
        favorites_only: mode === 'favorites',
        purchased_only:
          mode === 'purchases' ||
          mode === 'myProducts' ||
          mode === 'myCourses' ||
          mode === 'myBooks' ||
          mode === 'myResources',
        sort: topRated ? 'top_rated' : undefined,
      }),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0)
      return loaded < last.total && last.items.length > 0 ? loaded : undefined
    },
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  const total = query.data?.pages[0]?.total

  const tagsQuery = useQuery({ queryKey: ['consumer-catalog-tags'], queryFn: listConsumerCatalogTags })

  const favMutation = useMutation({
    mutationFn: toggleCatalogFavorite,
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const buyMutation = useMutation({
    mutationFn: (slug: string) => {
      const target = items.find((i) => i.slug === slug)
      return buyOrCheckoutCatalogItem(slug, target?.price, language)
    },
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const isMixedTypeView = mode === 'favorites' || mode === 'purchases'
  const groups = isMixedTypeView ? groupByType(items) : null
  const hasActiveFilters = Boolean(search.trim() || tagFilter.length || topRated)
  // A type-specific catalog (Products/Courses/Books/Resources) with zero
  // items and no filters applied means that whole catalog is genuinely
  // empty (nothing published yet), not just "no matches" — worth a
  // different, more useful message than the generic empty state, pointing
  // people at a catalog that does have content.
  const emptyIsWholeType = mode === 'type' && Boolean(type) && !hasActiveFilters
  const hc = language === 'en' ? HEADER_COPY.en : HEADER_COPY.es
  const meta = type ? TYPE_META[type] : null
  const HeroIcon = mode === 'favorites' ? Heart : (meta?.Icon ?? Package)

  return (
    <div className="space-y-6">
      {!hideHeader && titleKey && subtitleKey ? (
        <PremiumHero
          compact
          accent={mode === 'favorites' ? 'violet' : (meta?.accent ?? 'cyan')}
          badge={mode === 'type' ? hc.catalogBadge : hc.libraryBadge}
          title={t(titleKey) as string}
          subtitle={t(subtitleKey) as string}
          sidePanel={
            <div className="flex items-center gap-4 lg:justify-end">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                <HeroIcon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
              </span>
              {total !== undefined ? (
                <div>
                  <p className="font-display text-3xl font-semibold tabular-nums text-ase-text">{total}</p>
                  <p className="text-xs text-ase-muted">{hc.results(total).replace(/^\d+\s/, '')}</p>
                </div>
              ) : null}
            </div>
          }
        />
      ) : null}

      {!hideHeader && mode === 'type' ? (
        <nav aria-label={hc.switcher} className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-ase-surface/70 p-1.5">
          {TYPE_ORDER.map((tp) => {
            const { Icon } = TYPE_META[tp]
            return (
              <NavLink
                key={tp}
                to={TYPE_CATALOG_PATH[tp]}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                    isActive
                      ? 'bg-ase-brand/20 text-ase-text ring-1 ring-ase-brand/40'
                      : 'text-ase-muted hover:bg-white/[0.04] hover:text-ase-text',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(`catalog.groupLabels.${tp}`) as string}
              </NavLink>
            )
          })}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 basis-full sm:max-w-md sm:flex-1 sm:basis-auto">
          <span className="sr-only">{t('catalog.searchPlaceholder')}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            className="w-full rounded-xl border border-white/10 bg-ase-surface/80 py-2.5 pl-10 pr-4 text-sm text-ase-text outline-none transition placeholder:text-ase-muted focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
          />
        </label>
        <button
          type="button"
          aria-pressed={topRated}
          onClick={() => setTopRated((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition',
            topRated
              ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-text'
              : 'border-white/10 bg-ase-surface/80 text-ase-text2 hover:border-white/20 hover:text-ase-text',
          )}
        >
          <Star className={cn('h-4 w-4', topRated ? 'fill-amber-300 text-amber-300' : '')} aria-hidden />
          {t('catalog.rating.sortTopRated')}
        </button>
        {total !== undefined && hideHeader ? (
          <span className="ml-auto text-xs text-ase-muted">{hc.results(total)}</span>
        ) : null}
      </div>
      <TagFilterBar
        tags={tagsQuery.data ?? []}
        selected={tagFilter}
        onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
        onClear={() => setTagFilter(() => [])}
        label={t('catalog.tags.filterLabel')}
        clearLabel={t('catalog.tags.clear')}
      />
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-72 w-full rounded-3xl" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
      ) : items.length === 0 ? (
        emptyIsWholeType && type ? (
          <EmptyState
            title={t(`catalog.emptyByType.${type}.title`) as string}
            description={t(`catalog.emptyByType.${type}.description`) as string}
            actionLabel={t(`catalog.emptyByType.${type}.cta`) as string}
            onAction={() => navigate(TYPE_CATALOG_PATH[EMPTY_STATE_SUGGESTION[type]])}
          />
        ) : hasActiveFilters ? (
          <EmptyState title={t('catalog.emptyFiltered')} description={t('catalog.emptyFilteredHint')} />
        ) : mode === 'favorites' ? (
          <EmptyState
            title={t('catalog.emptyFavorites')}
            description={t('catalog.emptyFavoritesHint')}
            actionLabel={t('catalog.exploreCatalog') as string}
            onAction={() => navigate(TYPE_CATALOG_PATH.resource)}
          />
        ) : mode !== 'type' ? (
          <EmptyState
            title={t('catalog.emptyOwned')}
            description={t('catalog.emptyOwnedHint')}
            actionLabel={t('catalog.exploreCatalog') as string}
            onAction={() => navigate(TYPE_CATALOG_PATH[type ?? 'resource'])}
          />
        ) : (
          <EmptyState title={t('catalog.empty')} description={t('catalog.emptyHint')} />
        )
      ) : groups ? (
        <div className="space-y-8">
          {groups.map(([groupType, groupItems]) => (
            <div key={groupType}>
              <h2 className="mb-4 flex items-center gap-2.5 text-label font-semibold uppercase text-ase-muted">
                <span className="h-px w-6 bg-white/20" />
                {t(`catalog.groupLabels.${groupType}`)}
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] tabular-nums">{groupItems.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupItems.map((item) => (
                  <CatalogItemCard
                    key={item.slug}
                    item={item}
                    catalogBasePath={catalogBasePath}
                    favoritePending={pendingSlug === item.slug && favMutation.isPending}
                    purchasePending={pendingSlug === item.slug && buyMutation.isPending}
                    onToggleFavorite={(slug) => favMutation.mutate(slug)}
                    onPurchase={(slug) => buyMutation.mutate(slug)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <CatalogItemCard
              key={item.slug}
              item={item}
              catalogBasePath={catalogBasePath}
              favoritePending={pendingSlug === item.slug && favMutation.isPending}
              purchasePending={pendingSlug === item.slug && buyMutation.isPending}
              onToggleFavorite={(slug) => favMutation.mutate(slug)}
              onPurchase={(slug) => buyMutation.mutate(slug)}
            />
          ))}
        </div>
      )}
      {query.hasNextPage ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-xl border border-white/10 bg-ase-surface/80 px-5 py-2.5 text-sm font-semibold text-ase-text transition hover:border-ase-brand/40 disabled:opacity-60"
          >
            {hc.loadMore}
          </button>
          {total !== undefined ? <p className="text-xs text-ase-muted">{hc.showing(items.length, total)}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
