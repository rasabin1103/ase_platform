import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  listConsumerCatalog,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { CatalogItemCard } from './CatalogItemCard'
import { Eyebrow } from '../ui/Eyebrow'
import { Skeleton } from '../ui/Skeleton'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

/**
 * Lightweight, honest "keep exploring" strip: pulls real unpurchased catalog
 * items and, when the user already has purchase/favorite history, ranks
 * items from the same types higher. No fabricated recommendation score —
 * just a simple, explainable heuristic over real data.
 */
export function RecommendedForYouStrip() {
  const { t, language } = useI18n()
  const qc = useQueryClient()
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  const catalogQuery = useQuery({
    queryKey: ['consumer-catalog', 'strip', 'recommend-all'],
    queryFn: () => listConsumerCatalog({ limit: 24 }),
    staleTime: 30_000,
  })

  const purchasedQuery = useQuery({
    queryKey: ['consumer-catalog', 'strip', 'purchased-summary'],
    queryFn: () => listConsumerCatalog({ purchased_only: true, limit: 100 }),
    staleTime: 30_000,
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
    mutationFn: (slug: string) => {
      const target = catalogQuery.data?.items.find((i) => i.slug === slug)
      return buyOrCheckoutCatalogItem(slug, target?.price, language)
    },
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const recommended = useMemo(() => {
    const all = catalogQuery.data?.items ?? []
    const owned = purchasedQuery.data?.items ?? []
    const preferredTypes = new Set<CatalogItemType>(owned.map((i) => i.type))

    const unpurchased = all.filter((i) => !i.isPurchased)
    const ranked = [...unpurchased].sort((a, b) => {
      const aPref = preferredTypes.has(a.type) ? 0 : 1
      const bPref = preferredTypes.has(b.type) ? 0 : 1
      if (aPref !== bPref) return aPref - bPref
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return ranked.slice(0, 4)
  }, [catalogQuery.data, purchasedQuery.data])

  const isLoading = catalogQuery.isLoading || purchasedQuery.isLoading

  if (!isLoading && recommended.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 text-ase-brand" strokeWidth={1.75} />
        <Eyebrow>{t('independentDashboard.recommended.badge')}</Eyebrow>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommended.map((item: CatalogItem) => (
            <CatalogItemCard
              key={item.slug}
              item={item}
              catalogBasePath={`/catalog/${item.type}s`}
              favoritePending={pendingSlug === item.slug && favMutation.isPending}
              purchasePending={pendingSlug === item.slug && buyMutation.isPending}
              onToggleFavorite={(slug) => favMutation.mutate(slug)}
              onPurchase={(slug) => buyMutation.mutate(slug)}
              imageAspectClass="aspect-[4/3]"
            />
          ))}
        </div>
      )}
    </section>
  )
}
