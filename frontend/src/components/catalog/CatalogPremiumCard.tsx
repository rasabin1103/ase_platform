import { Link } from 'react-router-dom'
import { Heart, Check, ShoppingCart } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'
import { cn } from '../ui/cn'
import { catalogImageAspectClass } from './catalogCardShape'

type Props = {
  item: CatalogItem
  featured?: boolean
  onToggleFavorite: (slug: string) => void
  onPurchase: (slug: string) => void
  favoritePending?: boolean
  purchasePending?: boolean
  /** Overrides the type-based aspect ratio for non-featured cards — use in
   *  grids that mix several catalog types so every image renders at the same height. */
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

export function CatalogPremiumCard({
  item,
  featured,
  onToggleFavorite,
  onPurchase,
  favoritePending,
  purchasePending,
  imageAspectClass,
}: Props) {
  const { t } = useI18n()
  const detailPath = `/catalog/${item.type}/${item.slug}`

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.09]',
        'bg-ase-surface',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.55)]',
        'transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_28px_80px_rgba(0,0,0,0.65)]',
        featured && 'lg:col-span-2 lg:flex-row',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          featured ? 'lg:w-[42%]' : cn(imageAspectClass ?? catalogImageAspectClass(item.type), 'w-full'),
        )}
      >
        <AuthenticatedImage
          src={item.imageUrl}
          alt=""
          className={cn(
            'h-full w-full transition duration-500 ease-out group-hover:scale-[1.07]',
            featured && 'min-h-[180px] lg:min-h-full',
          )}
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
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(to top, rgba(6,10,20,0.9), rgba(6,10,20,0.15) 55%, transparent)' }}
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge variant="info" className="border-white/15 bg-black/45">
            {t(typeLabelKey(item.type))}
          </Badge>
          {item.isPurchased ? (
            <Badge className="border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
              {t('catalog.purchased')}
            </Badge>
          ) : null}
        </div>
        <button
          type="button"
          disabled={favoritePending}
          onClick={() => onToggleFavorite(item.slug)}
          aria-label={item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
          className={cn(
            'absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border transition',
            item.isFavorite
              ? 'border-rose-400/50 bg-rose-500/25 text-rose-200'
              : 'border-white/15 bg-black/45 text-ase-text hover:bg-black/60',
          )}
        >
          <Heart className="h-4 w-4" strokeWidth={1.75} fill={item.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className={cn('relative flex flex-1 flex-col gap-3 p-5 sm:p-6', featured && 'lg:justify-center')}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300/85">{item.category}</p>
          <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-ase-text sm:text-xl">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ase-text2 line-clamp-2">{item.shortDescription}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xl font-extrabold text-ase-text">
            {formatPrice(item.price, item.currency, t('catalog.free'))}
          </p>
          {item.duration ? (
            <span className="text-xs font-medium text-ase-muted">{item.duration}</span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Link to={detailPath}>
            <Button size="sm" variant="primary">
              {t('catalog.viewDetail')}
            </Button>
          </Link>
          {item.previewUrl ? (
            <a href={item.previewUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                {t('catalog.preview')}
              </Button>
            </a>
          ) : null}
          <Button
            size="sm"
            variant={item.isPurchased ? 'success' : 'ghost'}
            leftIcon={item.isPurchased ? <Check className="h-4 w-4" strokeWidth={2} /> : <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />}
            disabled={purchasePending || item.isPurchased}
            onClick={() => onPurchase(item.slug)}
          >
            {item.isPurchased ? t('catalog.purchased') : t('catalog.buy')}
          </Button>
        </div>
      </div>
    </article>
  )
}
