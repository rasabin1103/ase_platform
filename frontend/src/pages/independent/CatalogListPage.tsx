import { useMemo, useState } from 'react'
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
  titleKey: string
  subtitleKey: string
  catalogBasePath: string
}

export function CatalogListPage({ type, mode = 'type', titleKey, subtitleKey, catalogBasePath }: Props) {
  const { t, language } = useI18n()
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ase-text">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t(subtitleKey)}</p>
      </div>
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
        <EmptyState title={t('catalog.empty')} description={t('catalog.emptyHint')} />
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
