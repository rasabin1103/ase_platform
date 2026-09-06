import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  listConsumerCatalog,
  listConsumerCatalogTags,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { CatalogItemCard } from '../../components/catalog/CatalogItemCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

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
  const [search, setSearch] = useState('')
  const [topRated, setTopRated] = useState(false)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  const queryKey = useMemo(
    () => ['consumer-catalog', mode, type, search, topRated, tagFilter],
    [mode, type, search, topRated, tagFilter],
  )

  const query = useQuery({
    queryKey,
    queryFn: () =>
      listConsumerCatalog({
        limit: 50,
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
  })

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
      const target = query.data?.items.find((i) => i.slug === slug)
      return buyOrCheckoutCatalogItem(slug, target?.price, language)
    },
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const items = query.data?.items ?? []
  const isMixedTypeView = mode === 'favorites' || mode === 'purchases'
  const groups = isMixedTypeView ? groupByType(items) : null
  const hasActiveFilters = Boolean(search.trim() || tagFilter.length || topRated)
  // A type-specific catalog (Products/Courses/Books/Resources) with zero
  // items and no filters applied means that whole catalog is genuinely
  // empty (nothing published yet), not just "no matches" — worth a
  // different, more useful message than the generic empty state, pointing
  // people at a catalog that does have content.
  const emptyIsWholeType = mode === 'type' && Boolean(type) && !hasActiveFilters

  return (
    <div className="space-y-6">
      {!hideHeader && titleKey && subtitleKey ? (
        <div>
          <h1 className="text-2xl font-bold text-ase-text">{t(titleKey)}</h1>
          <p className="mt-1 text-sm text-ase-muted">{t(subtitleKey)}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catalog.searchPlaceholder')}
          className="w-full max-w-md rounded-xl border border-white/10 bg-ase-surface px-4 py-2.5 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
        />
        <button
          type="button"
          onClick={() => setTopRated((v) => !v)}
          className={
            topRated
              ? 'rounded-xl border border-ase-brand/40 bg-ase-brand/15 px-3 py-2.5 text-sm font-semibold text-ase-brand transition'
              : 'rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm font-semibold text-ase-text2 transition hover:border-white/20'
          }
        >
          {t('catalog.rating.sortTopRated')}
        </button>
      </div>
      <TagFilterBar
        tags={tagsQuery.data ?? []}
        selected={tagFilter}
        onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
        onClear={() => setTagFilter([])}
        label={t('catalog.tags.filterLabel')}
        clearLabel={t('catalog.tags.clear')}
      />
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-72 w-full rounded-xl" />
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
        ) : (
          <EmptyState title={t('catalog.empty')} description={t('catalog.emptyHint')} />
        )
      ) : groups ? (
        <div className="space-y-8">
          {groups.map(([groupType, groupItems]) => (
            <div key={groupType}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ase-muted">
                {t(`catalog.groupLabels.${groupType}`)}
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
    </div>
  )
}
