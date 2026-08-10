import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Check, ExternalLink, Heart, ListChecks, Package, ShieldCheck, ShoppingCart } from 'lucide-react'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import type { AccessTargetType } from '../../api/access_requests.api'
import {
  getConsumerCatalogItem,
  purchaseCatalogItem,
  toggleCatalogFavorite,
} from '../../api/consumerCatalog.api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { ImageCarousel } from '../../components/catalog/ImageCarousel'
import { RatingWidget } from '../../components/catalog/RatingWidget'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'

const TYPE_CATALOG_PATH: Record<CatalogItemType, string> = {
  product: '/catalog/products',
  course: '/catalog/courses',
  book: '/catalog/books',
  resource: '/catalog/resources',
}

function typeLabelKey(type: CatalogItemType): string {
  const map: Record<CatalogItemType, string> = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  }
  return map[type]
}

function formatPrice(price: string | number, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function BulletList({
  title,
  items,
  icon,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
}) {
  if (!items.length) return null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          {icon}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-ase-text2">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ase-brand/70" />
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
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ase-text2 transition hover:text-ase-text"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {t('catalog.backToCatalog')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <ImageCarousel
            images={item.images ?? []}
            fallbackUrl={item.imageUrl}
            aspectClassName={cn('border border-white/10', catalogImageAspectClass(catalogType))}
            overlay={
              <>
                {catalogType === 'book' ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-3"
                      style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-3 w-px bg-white/20" />
                  </>
                ) : null}
                <span className="absolute left-4 top-4 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text">
                  {t(typeLabelKey(catalogType))}
                </span>
              </>
            }
          />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
            <h1 className="mt-1.5 text-3xl font-bold text-ase-text">{item.title}</h1>
            <p className="mt-2 text-sm text-ase-muted">
              {t('catalog.author')}: {item.author}
              {item.duration ? ` · ${t('catalog.duration')}: ${item.duration}` : ''}
              {item.level ? ` · ${t('catalog.level')}: ${t(`catalog.levels.${item.level}`)}` : ''}
            </p>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-extrabold text-ase-text">
                  {formatPrice(item.price, item.currency, t('catalog.free'))}
                </div>
                {item.isPurchased ? (
                  <Badge className="mt-2 border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
                    {t('catalog.purchased')}
                  </Badge>
                ) : null}
              </div>
              <button
                type="button"
                disabled={favMutation.isPending}
                onClick={() => favMutation.mutate()}
                aria-label={item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition',
                  item.isFavorite
                    ? 'border-rose-400/50 bg-rose-500/15 text-rose-200'
                    : 'border-white/15 bg-white/[0.04] text-ase-text2 hover:text-ase-text',
                )}
              >
                <Heart className="h-5 w-5" strokeWidth={1.75} fill={item.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                variant={item.isPurchased ? 'success' : 'primary'}
                leftIcon={item.isPurchased ? <Check className="h-4 w-4" strokeWidth={2} /> : <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />}
                disabled={buyMutation.isPending || item.isPurchased}
                onClick={() => buyMutation.mutate()}
              >
                {item.isPurchased ? t('catalog.purchased') : t('catalog.buy')}
              </Button>
              {item.previewUrl ? (
                <a href={item.previewUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" strokeWidth={1.75} />}>
                    {t('catalog.openPreview')}
                  </Button>
                </a>
              ) : null}
            </div>

            {!item.isPurchased ? (
              <div className="mt-3 flex flex-wrap gap-2.5 border-t border-white/[0.06] pt-3">
                <Button variant="ghost" size="sm" onClick={() => setAccessModalOpen(true)}>
                  {t('catalog.requestAccess')}
                </Button>
                {showDemo ? (
                  <Button variant="ghost" size="sm" onClick={() => setDemoModalOpen(true)}>
                    {t('catalog.requestDemo')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>

          <p className="text-ase-text2 leading-relaxed">{item.longDescription}</p>

          <Card className="p-5">
            <RatingWidget item={item} />
          </Card>
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
        <BulletList title={t('catalog.benefits')} items={benefits} icon={<ListChecks className="h-4 w-4" strokeWidth={1.75} />} />
        <BulletList title={t('catalog.requirements')} items={requirements} icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />} />
        <BulletList title={t('catalog.included')} items={included} icon={<Package className="h-4 w-4" strokeWidth={1.75} />} />
      </div>
    </div>
  )
}



