import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { useI18n } from '../../i18n'

type Props = {
  limit: number
  offset: number
  total: number
  onOffsetChange: (offset: number) => void
}

/** Simple prev/next pager for admin list pages backed by limit/offset APIs. */
export function Pagination({ limit, offset, total, onOffsetChange }: Props) {
  const { t } = useI18n()
  if (total <= limit && offset === 0) return null

  const page = Math.floor(offset / limit) + 1
  const pageCount = Math.max(1, Math.ceil(total / limit))
  const canPrev = offset > 0
  const canNext = offset + limit < total
  const pageOfLabel = String(t('private.common.pageOf'))
    .replace('{{page}}', String(page))
    .replace('{{pageCount}}', String(pageCount))

  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
      <span className="text-xs text-ase-muted">{pageOfLabel}</span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canNext}
          onClick={() => onOffsetChange(offset + limit)}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  )
}
