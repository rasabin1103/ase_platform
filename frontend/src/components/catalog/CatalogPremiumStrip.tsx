import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  listConsumerCatalog,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { CatalogPremiumCard } from './CatalogPremiumCard'
import { Eyebrow } from '../ui/Eyebrow'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'
import { useState } from 'react'

type Props = {
  type: CatalogItemType
  titleKey: string
  subtitleKey: string
  catalogPath: string
  limit?: number
}

export function CatalogPremiumStrip({ type, titleKey, subtitleKey, catalogPath, limit = 3 }: Props) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['consumer-catalog', 'strip', type],
    queryFn: () => listConsumerCatalog({ type, limit }),
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
      const target = query.data?.items.find((i) => i.slug === slug)
      return buyOrCheckoutCatalogItem(slug, target?.price)
    },
    onMutate: (slug) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const items = query.data?.items ?? []

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{t('catalog.premium.badge')}</Eyebrow>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t(titleKey)}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ase-text2">{t(subtitleKey)}</p>
        </div>
        <Link to={catalogPath}>
          <Button variant="outline" size="sm">
            {t('catalog.premium.viewAll')}
          </Button>
        </Link>
      </div>
      <div className="relative z-[1] mt-8">
        {query.isLoading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-[1.75rem]" />
            <Skeleton className="h-72 rounded-[1.75rem]" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title={t('catalog.empty')} description={t('catalog.emptyHint')} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {items.slice(0, limit).map((item, index) => (
              <CatalogPremiumCard
                key={item.slug}
                item={item}
                featured={index === 0}
                favoritePending={pendingSlug === item.slug && favMutation.isPending}
                purchasePending={pendingSlug === item.slug && buyMutation.isPending}
                onToggleFavorite={(slug) => favMutation.mutate(slug)}
                onPurchase={(slug) => buyMutation.mutate(slug)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
