import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listConsumerCatalog,
  purchaseCatalogItem,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { CatalogItemCard } from '../../components/catalog/CatalogItemCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'

type Mode = 'type' | 'favorites' | 'purchases' | 'myCourses' | 'myBooks' | 'myResources'

type Props = {
  type?: CatalogItemType
  mode?: Mode
  titleKey: string
  subtitleKey: string
  catalogBasePath: string
}

export function CatalogListPage({ type, mode = 'type', titleKey, subtitleKey, catalogBasePath }: Props) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  const queryKey = useMemo(
    () => ['consumer-catalog', mode, type, search],
    [mode, type, search],
  )

  const query = useQuery({
    queryKey,
    queryFn: () =>
      listConsumerCatalog({
        limit: 50,
        type:
          mode === 'type'
            ? type
            : mode === 'myCourses'
              ? 'course'
              : mode === 'myBooks'
                ? 'book'
                : mode === 'myResources'
                  ? 'resource'
                  : undefined,
        search: search.trim() || undefined,
        favorites_only: mode === 'favorites',
        purchased_only: mode === 'purchases' || mode === 'myCourses' || mode === 'myBooks' || mode === 'myResources',
      }),
  })

  const favMutation = useMutation({
    mutationFn: toggleCatalogFavorite,
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const buyMutation = useMutation({
    mutationFn: purchaseCatalogItem,
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const items = query.data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ase-text">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t(subtitleKey)}</p>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        className="w-full max-w-md rounded-xl border border-white/10 bg-ase-surface/60 px-4 py-2.5 text-sm text-ase-text outline-none focus:border-cyan-300/40"
      />
      {query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('catalog.empty')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
