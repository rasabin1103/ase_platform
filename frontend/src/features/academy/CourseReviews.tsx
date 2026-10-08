import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { isAxiosError } from 'axios'
import { listCatalogShowcaseReviews } from '../../api/catalogShowcase.api'
import { getConsumerCatalogItem, submitCatalogItemReview } from '../../api/consumerCatalog.api'
import { StaticStars } from '../../components/catalog/RatingSummary'
import { useI18n } from '../../i18n'
import type { AcademyCourseAccess } from './api'

const K = 'catalog.review.course.'

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useI18n()
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label={t(`${K}starsGroup`)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t(`${K}starAria`).replace('{{n}}', String(n))}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <Star className={`h-7 w-7 transition ${n <= shown ? 'text-amber-300' : 'text-white/20'}`} strokeWidth={1.75} fill={n <= shown ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

const LABEL_KEYS = ['', 'one', 'two', 'three', 'four', 'five']

function useCourseReviewData(access: AcademyCourseAccess) {
  const slug = access.catalogSlug
  const type = access.catalogType ?? 'course'
  const canReview = !!slug && access.authenticated && access.hasAccess
  const reviews = useQuery({
    queryKey: ['academy-reviews', slug],
    queryFn: () => listCatalogShowcaseReviews(type, slug!, { limit: 10 }),
    enabled: !!slug && access.catalogStatus === 'published',
    staleTime: 60_000,
  })
  const mine = useQuery({
    queryKey: ['academy-my-review', slug],
    queryFn: () => getConsumerCatalogItem(slug!),
    enabled: canReview,
    staleTime: 60_000,
  })
  return { slug, canReview, reviews, myReview: mine.data?.myReview ?? null }
}

function ReviewForm({ slug, initial, onDone, compact }: { slug: string; initial?: { rating: number; comment: string | null } | null; onDone?: () => void; compact?: boolean }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const submit = useMutation({
    mutationFn: () => submitCatalogItemReview(slug, { rating, comment: comment.trim() || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academy-reviews', slug] })
      qc.invalidateQueries({ queryKey: ['academy-my-review', slug] })
      qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
      onDone?.()
    },
  })
  const error = submit.error
    ? isAxiosError(submit.error) && submit.error.response?.status === 403
      ? t(`${K}forbidden`)
      : t(`${K}error`)
    : null
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (rating > 0) submit.mutate()
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <StarInput value={rating} onChange={setRating} />
        {rating > 0 && <span className="text-body-sm text-ase-text2">{t(`${K}labels.${LABEL_KEYS[rating]}`)}</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={compact ? 2 : 3}
        placeholder={t(`${K}placeholder`)}
        className="w-full rounded-ase-md border border-ase-border bg-ase-bg px-3 py-2 text-body-sm text-ase-text placeholder:text-ase-muted/70 focus:border-ase-brand focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={rating === 0 || submit.isPending}
          className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
        >
          {submit.isPending ? t(`${K}sending`) : initial ? t(`${K}update`) : t(`${K}publish`)}
        </button>
        {error && <span className="text-caption text-ase-warning">{error}</span>}
      </div>
    </form>
  )
}

/** Opiniones del curso en la página del curso: resumen, comentarios y formulario. */
export function CourseReviews({ access }: { access: AcademyCourseAccess }) {
  const { t, language } = useI18n()
  const { slug, canReview, reviews, myReview } = useCourseReviewData(access)
  const [editing, setEditing] = useState(false)
  if (!slug || access.catalogStatus !== 'published') return null
  const data = reviews.data
  return (
    <section className="mt-10 space-y-4" aria-labelledby="course-reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="course-reviews" className="font-sans text-heading-sm font-semibold">
            {t(`${K}title`)}
          </h2>
          {data && data.reviewCount > 0 ? (
            <p className="mt-1 flex items-center gap-2 text-body-sm text-ase-text2">
              <StaticStars rating={data.averageRating ?? 0} />
              <span className="font-semibold text-ase-text">{(data.averageRating ?? 0).toLocaleString(language === 'en' ? 'en-GB' : 'es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="text-ase-muted">
                · {data.reviewCount === 1 ? t(`${K}countOne`) : t(`${K}count`).replace('{{count}}', String(data.reviewCount))}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-body-sm text-ase-muted">{t(`${K}empty`)}</p>
          )}
        </div>
      </div>

      {canReview && (
        <div className="rounded-ase-lg border border-ase-border bg-ase-surface p-4">
          {myReview && !editing ? (
            <div className="flex flex-wrap items-center gap-3 text-body-sm">
              <span className="text-ase-text2">{t(`${K}yours`)}</span>
              <StaticStars rating={myReview.rating} />
              {myReview.comment && <span className="text-ase-text2">«{myReview.comment}»</span>}
              <button type="button" onClick={() => setEditing(true)} className="text-ase-brand hover:underline">
                {t(`${K}edit`)}
              </button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-body-sm font-semibold text-ase-text">{myReview ? t(`${K}editTitle`) : t(`${K}rate`)}</p>
              <ReviewForm slug={slug} initial={myReview} onDone={() => setEditing(false)} />
            </>
          )}
        </div>
      )}
      {!access.authenticated && <p className="text-caption text-ase-muted">{t(`${K}signIn`)}</p>}

      {data && data.items.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.items.map((r, i) => (
            <li key={i} className="rounded-ase-lg border border-ase-border bg-ase-surface p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-body-sm font-semibold text-ase-text">{r.userDisplayName === 'Alumno ASE' ? t('catalog.review.course.anonymous') : r.userDisplayName}</span>
                <StaticStars rating={r.rating} />
              </div>
              {r.comment && <p className="text-body-sm text-ase-text2">{r.comment}</p>}
              <p className="mt-1 text-caption text-ase-muted">{new Date(r.createdAt).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Invitación a valorar el curso al terminar una misión (solo si aún no lo has hecho). */
export function CourseReviewPrompt({ access, lastMission }: { access: AcademyCourseAccess; lastMission: boolean }) {
  const { t } = useI18n()
  const { slug, canReview, myReview } = useCourseReviewData(access)
  const [sent, setSent] = useState(false)
  if (!slug || !canReview || access.catalogStatus !== 'published') return null
  if (sent) {
    return (
      <section className="rounded-ase-lg border border-ase-success/40 bg-ase-success/5 p-4 text-body-sm text-ase-text2">
        {t(`${K}thanks`)}
      </section>
    )
  }
  if (myReview) return null
  return (
    <section className="rounded-ase-lg border border-ase-brand/50 bg-ase-brand/5 p-5">
      <h2 className="mb-1 font-sans text-heading-sm font-semibold">
        {lastMission ? t(`${K}promptTitleLast`) : t(`${K}promptTitle`)}
      </h2>
      <p className="mb-3 text-body-sm text-ase-text2">{t(`${K}promptBody`)}</p>
      <ReviewForm slug={slug} compact onDone={() => setSent(true)} />
    </section>
  )
}
