import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../ui/cn'
import { visiblePages } from './catalogPagination.utils'

type Labels = {
  /** Nombre accesible de la navegación. */
  nav: string
  previous: string
  next: string
  /** «{{from}}–{{to}} de {{total}}». */
  showing: string
  /** «Página {{page}}» (nombre accesible de cada botón). */
  page: string
}

type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  labels: Labels
}

const fill = (template: string, values: Record<string, number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), template)

/** Paginación numerada del catálogo público (páginas a partir de 1). */
export function CatalogPagination({ page, pageSize, total, onPageChange, labels }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const button =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label={labels.nav} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm tabular-nums text-ase-muted">{fill(labels.showing, { from, to, total })}</p>
      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            className={cn(button, 'border border-white/10 bg-white/[0.03] text-ase-text2 hover:text-ase-text')}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={labels.previous}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          {visiblePages(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-ase-muted" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={fill(labels.page, { page: p })}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  button,
                  'tabular-nums',
                  p === page
                    ? 'bg-ase-brand/20 text-ase-text ring-1 ring-ase-brand/50'
                    : 'border border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:text-ase-text',
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(button, 'border border-white/10 bg-white/[0.03] text-ase-text2 hover:text-ase-text')}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label={labels.next}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </nav>
  )
}
