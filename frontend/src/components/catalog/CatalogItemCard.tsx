import { Link } from 'react-router-dom'
import { Heart, Check, ShoppingCart } from 'lucide-react'
import { Button, ButtonLink } from '../ui/Button'
import { Card } from '../ui/Card'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { cn } from '../ui/cn'
import { catalogImageAspectClass } from './catalogCardShape'
import { AcademyCourseProgress } from '../../features/academy/AcademyCourseProgress'
import { RatingSummary } from './RatingSummary'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

type Props = {
  item: CatalogItem
  catalogBasePath: string
  onToggleFavorite: (slug: string) => void
  onPurchase: (slug: string) => void
  favoritePending?: boolean
  purchasePending?: boolean
  /** Overrides the type-based aspect ratio — use in grids that mix several
   *  catalog types so every image renders at the same height. */
  imageAspectClass?: string
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

export function CatalogItemCard({
  item,
  onToggleFavorite,
  onPurchase,
  favoritePending,
  purchasePending,
  imageAspectClass,
}: Props) {
  const { t, language } = useI18n()
  const auth = useAuth()
  const detailPath = `/catalog/${item.type}/${item.slug}`
  // Same rule as CatalogDetailPage: a free item (price 0) needs no purchase
  // click at all — the "Comprar" button just doesn't apply to it.
  const isFree = !Number(item.price)
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const shortDescription = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-3xl border-white/10 bg-ase-surface/80 p-0 hover:border-ase-brand/40" interactive>
      <div className={cn('relative overflow-hidden bg-ase-bg2', imageAspectClass ?? catalogImageAspectClass(item.type))}>
        <AuthenticatedImage
          src={item.imageUrl}
          alt=""
          fit="contain"
          className="h-full w-full transition duration-500 ease-out group-hover:scale-[1.08]"
        />
        {item.type === 'book' ? (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-2.5"
              style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
            />
            <div className="pointer-events-none absolute inset-y-0 left-2.5 w-px bg-white/20" />
          </>
        ) : null}
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-ase-text">
          {t(typeLabelKey(item.type))}
        </span>
        <button
          type="button"
          disabled={favoritePending}
          onClick={() => onToggleFavorite(item.slug)}
          aria-label={item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
          className={cn(
            'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border transition',
            item.isFavorite
              ? 'border-rose-400/50 bg-rose-500/25 text-rose-200'
              : 'border-white/15 bg-black/50 text-ase-text hover:bg-black/65',
          )}
        >
          <Heart className="h-4 w-4" strokeWidth={1.75} fill={item.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">{item.category}</p>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ase-text line-clamp-2">{title}</h3>
          <p className="mt-1.5 text-sm text-ase-muted line-clamp-2">{shortDescription}</p>
          <RatingSummary average={item.averageRating} count={item.reviewCount} className="mt-1.5" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xl font-semibold text-ase-text">
          {item.discountedPrice != null ? (
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm font-normal text-ase-text-muted line-through">
                {formatPrice(item.price, item.currency, t('catalog.free'))}
              </span>
              <span>{formatPrice(item.discountedPrice, item.currency, t('catalog.free'))}</span>
            </span>
          ) : (
            formatPrice(item.price, item.currency, t('catalog.free'))
          )}
        </p>
        {item.isPurchased ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {item.isPlanIncluded ? t('catalog.includedInPlan') : t('catalog.purchased')}
          </span>
        ) : null}
        </div>
        {item.discountedPrice != null && item.discountPercent != null ? (
          <p className="-mt-1 text-[11px] font-medium text-ase-brand">
            {String(t('catalog.resource.discountContext'))
              .replace(
                '{{planName}}',
                (language === 'en' && auth.currentUser?.plan_name_en
                  ? auth.currentUser.plan_name_en
                  : auth.currentUser?.plan_name) || (t('catalog.resource.discountContextFallbackPlan') as string),
              )
              .replace('{{percent}}', String(item.discountPercent))}
          </p>
        ) : null}
        {item.type === 'course' && item.academyCourseKey && (item.isPurchased || isFree) ? (
          <AcademyCourseProgress courseKey={item.academyCourseKey} language={language} />
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
          <ButtonLink to={detailPath} size="sm" variant="primary">
            {t('catalog.viewDetail')}
          </ButtonLink>
          {item.hasResourceContent ? (
            <ButtonLink to={`${detailPath}?preview=1`} size="sm" variant="outline">
              {t('catalog.preview')}
            </ButtonLink>
          ) : null}
          {!isFree && !item.isPurchased ? (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<ShoppingCart className="h-4 w-4" strokeWidth={1.75} />}
              disabled={purchasePending}
              onClick={() => onPurchase(item.slug)}
            >
              {t('catalog.buy')}
            </Button>
          ) : null}
        </div>
        <Link to={detailPath} className="sr-only">
          {title}
        </Link>
      </div>
    </Card>
  )
}
