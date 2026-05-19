import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import type { AccessTargetType } from '../../api/access_requests.api'
import {
  getConsumerCatalogItem,
  purchaseCatalogItem,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'

const TYPE_CATALOG_PATH: Record<CatalogItemType, string> = {
  product: '/catalog/products',
  course: '/catalog/courses',
  book: '/catalog/books',
  resource: '/catalog/resources',
}

function formatPrice(price: string | number, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-ase-text2">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-cyan-300">✦</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CatalogDetailPage() {
  const { type, slug } = useParams<{ type: CatalogItemType; slug: string }>()
  const { t } = useI18n()
  const qc = useQueryClient()
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  const query = useQuery({
    queryKey: ['consumer-catalog', slug],
    queryFn: () => getConsumerCatalogItem(slug!),
    enabled: Boolean(slug),
  })

  const favMutation = useMutation({
    mutationFn: () => toggleCatalogFavorite(slug!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumer-catalog', slug] }),
  })

  const buyMutation = useMutation({
    mutationFn: () => purchaseCatalogItem(slug!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumer-catalog', slug] }),
  })

  const item = query.data
  const backPath = type && TYPE_CATALOG_PATH[type] ? TYPE_CATALOG_PATH[type] : '/dashboard'

  if (query.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (query.isError || !item) {
    return <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
  }

  const benefits = item.benefits ?? []
  const requirements = item.requirements ?? []
  const included = item.includedItems ?? []
  const catalogType = (type ?? item.type) as CatalogItemType
  const targetType = catalogType as AccessTargetType
  const showDemo = catalogType === 'product' || catalogType === 'course'

  return (
    <div className="space-y-8">
      <Link to={backPath} className="text-sm text-cyan-300 hover:underline">
        ← {t('catalog.backToCatalog')}
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
          <h1 className="text-3xl font-bold text-ase-text">{item.title}</h1>
          <p className="text-sm text-ase-muted">
            {t('catalog.author')}: {item.author}
            {item.duration ? ` · ${t('catalog.duration')}: ${item.duration}` : ''}
            {item.level ? ` · ${t('catalog.level')}: ${t(`catalog.levels.${item.level}`)}` : ''}
          </p>
          <p className="text-3xl font-bold text-ase-text">
            {formatPrice(item.price, item.currency, t('catalog.free'))}
          </p>
          <p className="text-ase-text2 leading-relaxed">{item.longDescription}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {item.previewUrl ? (
              <a href={item.previewUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">{t('catalog.openPreview')}</Button>
              </a>
            ) : null}
            <Button
              variant="secondary"
              disabled={favMutation.isPending}
              onClick={() => favMutation.mutate()}
            >
              {item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
            </Button>
            <Button
              variant="primary"
              disabled={buyMutation.isPending || item.isPurchased}
              onClick={() => buyMutation.mutate()}
            >
              {item.isPurchased ? t('catalog.purchased') : t('catalog.buy')}
            </Button>
            {!item.isPurchased ? (
              <>
                <Button variant="outline" onClick={() => setAccessModalOpen(true)}>
                  {t('catalog.requestAccess')}
                </Button>
                {showDemo ? (
                  <Button variant="outline" onClick={() => setDemoModalOpen(true)}>
                    {t('catalog.requestDemo')}
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <AccessRequestModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['my-access-requests'] })}
        requestType="product_access"
        targetType={targetType}
        targetId={item.slug}
        title={`${t('catalog.requestAccessTitle')}: ${item.title}`}
        modalTitle={t('catalog.requestAccess')}
      />
      {showDemo ? (
        <AccessRequestModal
          open={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['my-access-requests'] })}
          requestType="demo_access"
          targetType={targetType}
          targetId={item.slug}
          title={`${t('catalog.requestDemoTitle')}: ${item.title}`}
          modalTitle={t('catalog.requestDemo')}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <BulletList title={t('catalog.benefits')} items={benefits} />
        <BulletList title={t('catalog.requirements')} items={requirements} />
        <BulletList title={t('catalog.included')} items={included} />
      </div>
    </div>
  )
}



