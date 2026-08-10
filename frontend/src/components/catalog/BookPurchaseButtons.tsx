import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import type { BookPurchaseLink } from '../../types/catalog.types'
import { formatPrice } from '../../lib/formatPrice'

type Props = {
  links: BookPurchaseLink[]
}

export function BookPurchaseButtons({ links }: Props) {
  const sorted = [...links]
    .filter((l) => l.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (!sorted.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {sorted.map((link) => {
        const priceLabel =
          link.price != null && link.currency
            ? formatPrice(link.price, link.currency)
            : null
        return (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button
              size="lg"
              variant={link.isPrimary || link.platform === 'ase' ? 'primary' : 'secondary'}
              className={cn(
                link.isPrimary && 'shadow-[0_0_24px_rgba(56,189,248,0.2)]',
                'min-w-[180px]',
              )}
            >
              <span>{link.label}</span>
              {priceLabel ? <span className="ml-2 text-xs opacity-80">· {priceLabel}</span> : null}
            </Button>
          </a>
        )
      })}
    </div>
  )
}
