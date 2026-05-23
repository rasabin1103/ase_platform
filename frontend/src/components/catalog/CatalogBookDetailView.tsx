import { Link } from 'react-router-dom'
import type { CatalogItem } from '../../types/catalog.types'
import { CatalogImage } from './CatalogImage'
import { CatalogImageGallery } from './CatalogImageGallery'
import { BookPurchaseButtons } from './BookPurchaseButtons'
import { CatalogRichContentRenderer } from './CatalogRichContentRenderer'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

function formatPrice(price: string | number, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

type Props = {
  item: CatalogItem
  backPath: string
  onToggleFavorite: () => void
  onPurchase: () => void
  onRequestAccess: () => void
  favoritePending?: boolean
  purchasePending?: boolean
}

export function CatalogBookDetailView({
  item,
  backPath,
  onToggleFavorite,
  onPurchase,
  onRequestAccess,
  favoritePending,
  purchasePending,
}: Props) {
  const { t } = useI18n()
  const purchaseLinks = item.purchaseLinks ?? []
  const hasPurchaseLinks = purchaseLinks.some((l) => l.isActive)
  const legacyAmazon =
    Boolean(item.amazonUrl) &&
    !hasPurchaseLinks &&
    (item.purchaseProvider === 'amazon' || (!item.pricingPlans?.length && item.purchaseProvider !== 'internal'))

  return (
    <div className="space-y-10">
      <Link to={backPath} className="text-sm text-cyan-300 hover:underline">
        ← {t('catalog.backToCatalog')}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-sm lg:sticky lg:top-8">
          <CatalogImageGallery
            images={item.images ?? []}
            fallbackSrc={item.imageUrl}
            alt={item.title}
            cacheKey={item.updatedAt}
            type="book"
          />
          {(item.imageCount ?? item.images?.length ?? 0) > 1 ? (
            <p className="mt-2 text-center text-xs text-ase-muted">
              +{(item.imageCount ?? item.images?.length ?? 0) - 1} {t('catalog.moreImages')}
            </p>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{t('catalog.typeBook')}</Badge>
            <Badge variant="default">{item.category}</Badge>
            {item.bookFormat ? <Badge variant="default">{item.bookFormat}</Badge> : null}
            {item.level ? <Badge variant="default">{t(`catalog.levels.${item.level}`)}</Badge> : null}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-ase-text sm:text-5xl">{item.title}</h1>
          <p className="text-lg text-ase-text2">{item.shortDescription}</p>
          <p className="text-sm text-ase-muted">
            {t('catalog.author')}: <span className="text-ase-text">{item.author}</span>
            {item.duration ? (
              <>
                {' '}
                · {t('catalog.bookPages')}: <span className="text-ase-text">{item.duration}</span>
              </>
            ) : null}
          </p>

          {!item.pricingPlans?.length ? (
            <p className="text-3xl font-bold text-ase-text">
              {formatPrice(item.price, item.currency, t('catalog.free'))}
            </p>
          ) : (
            <p className="text-sm text-ase-text2">
              {t('catalog.pricingOnPlansPage')}{' '}
              <Link to="/plans" className="font-semibold text-cyan-300 hover:underline">
                {t('catalog.viewAvailablePlans')}
              </Link>
            </p>
          )}

          <div className="space-y-3">
            {hasPurchaseLinks ? <BookPurchaseButtons links={purchaseLinks} /> : null}
            {!hasPurchaseLinks && legacyAmazon && item.amazonUrl ? (
              <a href={item.amazonUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="primary">
                  {t('catalog.buyOnAmazon')}
                </Button>
              </a>
            ) : null}
            {!hasPurchaseLinks && !legacyAmazon ? (
              <Button
                size="lg"
                variant="primary"
                disabled={purchasePending || item.isPurchased}
                onClick={onPurchase}
              >
                {item.isPurchased ? t('catalog.purchased') : t('catalog.buy')}
              </Button>
            ) : null}
            {!hasPurchaseLinks && !legacyAmazon && !item.amazonUrl && item.purchaseProvider === 'request_only' ? (
              <p className="text-sm text-ase-muted">{t('catalog.comingSoonPurchase')}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {item.previewPdfUrl ? (
                <a href={item.previewPdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline">
                    {t('catalog.openPdfPreview')}
                  </Button>
                </a>
              ) : null}
              {item.sampleDownloadUrl ? (
                <a href={item.sampleDownloadUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline">
                    {t('catalog.downloadSample')}
                  </Button>
                </a>
              ) : null}
              <Button size="lg" variant="outline" disabled={favoritePending} onClick={onToggleFavorite}>
                {item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
              </Button>
              <Button size="lg" variant="outline" onClick={onRequestAccess}>
                {t('catalog.requestAccess')}
              </Button>
              {!hasPurchaseLinks && item.externalPurchaseUrl && item.purchaseProvider === 'external' ? (
                <a href={item.externalPurchaseUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="secondary">
                    {t('catalog.buyExternal')}
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {item.previewPdfUrl ? (
        <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-ase-surface/60 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ase-text">{t('catalog.pdfPreviewTitle')}</h2>
          <p className="mt-2 text-sm text-ase-text2">
            {item.previewPages
              ? t('catalog.pdfPreviewHintPages').replace('{n}', String(item.previewPages))
              : t('catalog.pdfPreviewHint')}
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-ase-bg2/80">
            <iframe
              title={t('catalog.pdfPreviewTitle')}
              src={item.previewPdfUrl}
              className="h-[min(480px,60vh)] w-full"
            />
          </div>
        </Card>
      ) : null}

      <Card className="rounded-[2rem] border-white/10 bg-ase-surface/55 p-6 sm:p-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
          {t('catalog.aboutThisBook')}
        </h2>
        <div className="mt-6">
          <CatalogRichContentRenderer
            markdown={item.richContentMarkdown}
            fallbackText={item.longDescription}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {item.benefits?.length ? <SectionCard title={t('catalog.benefits')} items={item.benefits} /> : null}
        {item.includedItems?.length ? (
          <SectionCard title={t('catalog.included')} items={item.includedItems} />
        ) : null}
        {item.audience?.length ? <SectionCard title={t('catalog.bookAudience')} items={item.audience} /> : null}
        {item.requirements?.length ? (
          <SectionCard title={t('catalog.requirements')} items={item.requirements} />
        ) : null}
      </div>

      {item.relatedItems && item.relatedItems.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ase-text">{t('catalog.relatedBooks')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {item.relatedItems.map((rel) => (
              <Link
                key={rel.id}
                to={`/catalog/book/${rel.slug}`}
                className={cn(
                  'group overflow-hidden rounded-2xl border border-white/10 bg-ase-surface/60',
                  'transition hover:border-cyan-300/25',
                )}
              >
                <CatalogImage src={rel.imageUrl} type="book" variant="card" alt={rel.title} />
                <div className="p-4">
                  <p className="font-semibold text-ase-text group-hover:text-cyan-100">{rel.title}</p>
                  <p className="mt-1 text-xs text-ase-muted">{rel.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">{title}</h3>
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
