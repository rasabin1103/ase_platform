import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, ListChecks, Sparkles, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import { getCatalogShowcaseItem } from '../../api/catalogShowcase.api'
import type { CatalogItemType, CatalogShowcaseItemDetail } from '../../api/catalogShowcase.api'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { RatingSummary } from '../../components/catalog/RatingSummary'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { MarkdownContent } from '../../components/catalog/MarkdownViewer'
import { CatalogShowcasePreviewModal } from '../../components/catalog/CatalogShowcasePreviewModal'
import { JsonLd, SITE_URL } from '../../components/seo/JsonLd'
import { useAuth } from '../../hooks/useAuth'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

function formatPrice(price: string, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function BulletList({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
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

export function CatalogShowcaseDetailPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>()
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const auth = useAuth()
  const qc = useQueryClient()
  const [previewOpen, setPreviewOpen] = useState(false)

  const itemType = type as CatalogItemType

  const query = useQuery({
    queryKey: ['catalog-showcase-item', itemType, slug],
    queryFn: () => getCatalogShowcaseItem(itemType, slug as string),
    enabled: Boolean(itemType && slug),
    retry: false,
  })

  const buyMutation = useMutation({
    mutationFn: (item: CatalogShowcaseItemDetail) => buyOrCheckoutCatalogItem(item.slug, item.price, language),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    },
  })

  const item = query.data
  const title = item ? localizedCatalogText(language, item.title, item.titleEn) : ''
  const shortDescription = item ? localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn) : ''
  const longDescription = item ? localizedCatalogText(language, item.longDescription, item.longDescriptionEn) : ''

  usePageTitle(item ? title : '', item ? shortDescription : undefined)

  const catalogPath = '/catalog'

  const productJsonLd =
    item && itemType && slug
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title,
          description: shortDescription,
          image: item.imageUrl ? `${SITE_URL}${item.imageUrl}` : undefined,
          brand: { '@type': 'Brand', name: 'Arce Sabin Engineering' },
          offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/catalog/item/${itemType}/${slug}`,
            priceCurrency: item.currency,
            price: item.price,
            availability: 'https://schema.org/InStock',
          },
          ...(item.averageRating != null && item.reviewCount > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: item.averageRating,
                  reviewCount: item.reviewCount,
                },
              }
            : {}),
        }
      : null

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-3 h-24 w-full rounded-lg" />
      </div>
    )
  }

  if (query.isError || !item) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
        <EmptyState
          title={t('publicCatalogShowcase.detail.notFound.title')}
          description={t('publicCatalogShowcase.detail.notFound.description')}
          actionLabel={t('publicCatalogShowcase.detail.back')}
          onAction={() => navigate(catalogPath)}
        />
      </div>
    )
  }

  const isBuying = buyMutation.isPending

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
      {productJsonLd ? <JsonLd data={productJsonLd} /> : null}

      <Link
        to={catalogPath}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ase-text2 transition hover:text-ase-text"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {t('publicCatalogShowcase.detail.back')}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div>
          <div className={`overflow-hidden rounded-2xl bg-ase-bg2 ${catalogImageAspectClass(itemType)}`}>
            <AuthenticatedImage src={item.imageUrl} alt="" fit="contain" className="h-full w-full" />
          </div>
          {item.hasPreview ? (
            <Button
              variant="outline"
              className="mt-3 w-full"
              leftIcon={<Eye className="h-4 w-4" strokeWidth={1.75} />}
              onClick={() => setPreviewOpen(true)}
            >
              {t('publicCatalogShowcase.detail.preview')}
            </Button>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{t(`publicCatalogShowcase.type.${item.type}`)}</Badge>
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ase-text sm:text-3xl">{title}</h1>
          <RatingSummary average={item.averageRating} count={item.reviewCount} className="mt-2" />
          {item.averageRating == null ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ase-muted">
              <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('publicCatalogShowcase.noRating')}
            </p>
          ) : null}

          <p className="mt-4 text-sm leading-relaxed text-ase-text2">{shortDescription}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ase-text2">
            <span>
              {t('catalog.author')}: <span className="text-ase-text">{item.author}</span>
            </span>
            <span>
              {t('catalog.level')}: <span className="text-ase-text">{t(`catalog.levels.${item.level}`)}</span>
            </span>
            {item.duration ? (
              <span>
                {t('catalog.duration')}: <span className="text-ase-text">{item.duration}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <div className="text-3xl font-extrabold tracking-tight text-ase-text">
              {formatPrice(item.price, item.currency, t('publicCatalogShowcase.free'))}
            </div>
          </div>

          <div className="mt-4">
            {auth.isAuthenticated ? (
              <Button
                size="lg"
                variant="primary"
                disabled={isBuying}
                onClick={() => buyMutation.mutate(item)}
              >
                {isBuying ? t('pricing.checkoutLoading') : t('publicCatalogShowcase.detail.ctaBuy')}
              </Button>
            ) : (
              <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
                {t('publicCatalogShowcase.detail.ctaSignup')}
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-ase-muted">{t('publicCatalogShowcase.detail.shareHint')}</p>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
              {t('publicCatalogShowcase.detail.aboutTitle')}
            </h2>
          </div>
          <div className="mt-3">
            <MarkdownContent content={longDescription} />
          </div>
        </Card>

        <BulletList
          title={t('catalog.benefits')}
          items={item.benefits}
          icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
        />
        <BulletList
          title={t('catalog.requirements')}
          items={item.requirements}
          icon={<ListChecks className="h-4 w-4" strokeWidth={1.75} />}
        />
        <BulletList
          title={t('catalog.included')}
          items={item.includedItems}
          icon={<ListChecks className="h-4 w-4" strokeWidth={1.75} />}
        />
      </div>

      <CatalogShowcasePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        itemType={itemType}
        slug={item.slug}
        title={title}
      />
    </div>
  )
}
