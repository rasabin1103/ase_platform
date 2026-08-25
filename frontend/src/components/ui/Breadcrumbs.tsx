import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  /** Omit on the last (current-page) item — it renders as plain text. */
  to?: string
}

/** Clickable breadcrumb trail for public pages — e.g. "Inicio / Blog / <título>".
 * The last item (no `to`) is treated as the current page: not a link, and
 * marked aria-current for accessibility. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ase-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ase-muted/60" strokeWidth={2} />}
            {item.to && !isLast ? (
              <Link to={item.to} className="transition hover:text-ase-text">
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? 'max-w-[16rem] truncate text-ase-text2' : undefined}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
