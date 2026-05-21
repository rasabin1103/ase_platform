import { Link } from 'react-router-dom'
import { CatalogImage } from './CatalogImage'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'
import { cn } from '../ui/cn'

type Props = {
  item: CatalogItem
  featured?: boolean
  onToggleFavorite: (slug: string) => void
  onPurchase: (slug: string) => void
  favoritePending?: boolean
  purchasePending?: boolean
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
}: Props) {
  const { t } = useI18n()
  const detailPath = `/catalog/${item.type}/${item.slug}`

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.09]',
        'bg-gradient-to-b from-white/[0.07] via-ase-surface/50 to-ase-bg2/90',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_22px_70px_rgba(0,0,0,0.55)]',
        'transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_28px_80px_rgba(0,0,0,0.65)]',
        featured && 'lg:col-span-2 lg:flex-row',
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />
      <div
        className={cn(
          'relative overflow-hidden',
          featured ? 'lg:w-[48%]' : 'aspect-[16/10] w-full',
        )}
      >
        <CatalogImage
          src={item.imageUrl}
          type={item.type}
          variant={featured ? 'hero' : 'card'}
          alt={item.title}
          cacheKey={item.updatedAt}
          className={cn(featured && 'min-h-[220px] lg:min-h-full')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ase-bg/90 via-ase-bg/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge variant="info" className="border-white/15 bg-black/45 backdrop-blur-md">
            {t(typeLabelKey(item.type))}
          </Badge>
          {item.isPurchased ? (
            <Badge className="border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
              {t('catalog.purchased')}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className={cn('relative flex flex-1 flex-col gap-4 p-6 sm:p-7', featured && 'lg:justify-center')}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300/85">{item.category}</p>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight text-ase-text sm:text-2xl">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ase-text2 line-clamp-3">{item.shortDescription}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-2xl font-extrabold text-ase-text">
            {formatPrice(item.price, item.currency, t('catalog.free'))}
          </p>
          {item.duration ? (
            <span className="text-xs font-medium text-ase-muted">{item.duration}</span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
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
            variant="secondary"
            disabled={favoritePending}
            onClick={() => onToggleFavorite(item.slug)}
          >
            {item.isFavorite ? '♥' : '♡'} {item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
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
