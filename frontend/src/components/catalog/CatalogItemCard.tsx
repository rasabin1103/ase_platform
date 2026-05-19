import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

type Props = {
  item: CatalogItem
  catalogBasePath: string
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

export function CatalogItemCard({
  item,
  catalogBasePath,
  onToggleFavorite,
  onPurchase,
  favoritePending,
  purchasePending,
}: Props) {
  const { t } = useI18n()
  const detailPath = `/catalog/${item.type}/${item.slug}`

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0" interactive>
      <div className="relative aspect-[16/10] overflow-hidden bg-ase-bg2">
        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text backdrop-blur">
          {t(typeLabelKey(item.type))}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300/80">{item.category}</p>
          <h3 className="mt-1 text-lg font-bold text-ase-text line-clamp-2">{item.title}</h3>
          <p className="mt-2 text-sm text-ase-muted line-clamp-3">{item.shortDescription}</p>
        </div>
        <p className="text-xl font-bold text-ase-text">
          {formatPrice(item.price, item.currency, t('catalog.free'))}
        </p>
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
            {item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
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
        <Link to={catalogBasePath} className="sr-only">
          {item.title}
        </Link>
      </div>
    </Card>
  )
}
