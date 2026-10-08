import { useQuery } from '@tanstack/react-query'
import { listCatalogShowcaseReviews, type CatalogItemType } from '../../api/catalogShowcase.api'
import { Card } from '../ui/Card'
import { StaticStars } from './RatingSummary'
import { useI18n } from '../../i18n'

/** Opiniones públicas (estrellas + comentario) en la ficha pública de un ítem. No se muestra si aún no hay ninguna. */
export function PublicReviewList({ type, slug, title, language }: { type: CatalogItemType; slug: string; title: string; language: string }) {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['catalog-showcase-reviews', type, slug],
    queryFn: () => listCatalogShowcaseReviews(type, slug, { limit: 10 }),
    staleTime: 60_000,
  })
  const items = (query.data?.items ?? []).filter((r) => r.comment)
  if (items.length === 0) return null
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((r, i) => (
          <li key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ase-text">{r.userDisplayName === 'Alumno ASE' ? t('catalog.review.course.anonymous') : r.userDisplayName}</span>
              <StaticStars rating={r.rating} />
            </div>
            <p className="mt-1 text-sm text-ase-text2">{r.comment}</p>
            <p className="mt-1 text-[11px] text-ase-muted">
              {new Date(r.createdAt).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
