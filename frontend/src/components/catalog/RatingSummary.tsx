import { Star } from 'lucide-react'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

export function StaticStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('h-3.5 w-3.5', n <= Math.round(rating) ? 'text-amber-300' : 'text-white/15')}
          strokeWidth={1.75}
          fill={n <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

/**
 * Amazon-style "stars + average + review count" line. Renders nothing when
 * there are no reviews yet — same rule the detail page's ReviewWidget uses,
 * so a fresh item's card doesn't show an empty/misleading 0.0 rating.
 */
export function RatingSummary({
  average,
  count,
  className,
}: {
  average: number | null | undefined
  count: number
  className?: string
}) {
  const { t } = useI18n()
  if (average == null || count <= 0) return null
  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-ase-muted', className)}>
      <StaticStars rating={average} />
      <span>
        <span className="font-semibold text-ase-text2">{average.toFixed(1)}</span>{' '}
        {(count === 1 ? t('catalog.review.countOne') : t('catalog.review.count')).replace('{{count}}', String(count))}
      </span>
    </div>
  )
}
