import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight, Eye, Layers, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogItemPath, getAcademyCourseSeries, type AcademySeriesCourse } from './api'
import { getCourse } from './content/courseList'
import type { AcademyLang } from './i18n'
import { readMissionStatus, useAcademyUserKey } from './useMissionRun'

const COPY = {
  es: {
    series: 'Serie',
    seen: (n: number, total: number) => `Has empezado ${n} de ${total} cursos`,
    here: 'Estás aquí',
    notStarted: 'Sin empezar',
    inProgress: (done: number, total: number) => `En curso · ${done}/${total} misiones`,
    completed: 'Completado',
    soon: 'Próximamente',
    free: 'Gratis con tu cuenta',
    owned: 'Tienes acceso',
    paid: 'De pago',
    next: 'Siguiente en la serie',
  },
  en: {
    series: 'Series',
    seen: (n: number, total: number) => `You've started ${n} of ${total} courses`,
    here: 'You are here',
    notStarted: 'Not started',
    inProgress: (done: number, total: number) => `In progress · ${done}/${total} missions`,
    completed: 'Completed',
    soon: 'Coming soon',
    free: 'Free with your account',
    owned: 'You have access',
    paid: 'Paid',
    next: 'Next in the series',
  },
}

type Progress = { state: 'not_started' | 'in_progress' | 'completed'; done: number; total: number }

/** Progreso del curso: el del servidor o, sin sesión, el guardado en este navegador. */
function progressOf(item: AcademySeriesCourse, userKey: string): Progress | null {
  const course = item.courseKey ? getCourse(item.courseKey) : undefined
  if (!course) return null
  const playable = course.missions.filter((m) => m.available)
  const local = playable.map((m) => readMissionStatus({ courseKey: course.key, id: m.id }, userKey))
  const started = Math.max(item.missionsStarted, local.filter((s) => s !== 'new').length)
  const done = Math.max(item.missionsFinished, local.filter((s) => s === 'finished').length)
  const total = course.missions.length
  if (started === 0 && done === 0) return { state: 'not_started', done, total }
  return { state: done >= total ? 'completed' : 'in_progress', done: Math.min(done, total), total }
}

function formatPrice(price: string | number | null, currency: string | null, lang: AcademyLang): string {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency: currency || 'EUR' }).format(Number(price ?? 0))
}

/**
 * Todos los cursos de la serie del curso (Ruta SQL…), los empezados y los que
 * no, en orden, como el panel de serie de los recursos del catálogo. No se
 * muestra si el curso no pertenece a una serie de dos o más.
 */
export function CourseSeries({ courseKey, lang }: { courseKey: string; lang: AcademyLang }) {
  const c = COPY[lang]
  const { userKey, authReady } = useAcademyUserKey()
  const query = useQuery({
    queryKey: ['academy-course-series', courseKey, userKey],
    queryFn: () => getAcademyCourseSeries(courseKey),
    enabled: authReady && !!courseKey,
    retry: 1,
    staleTime: 60_000,
  })
  const data = query.data
  if (!data?.seriesName || data.items.length < 2) return null

  const rows = data.items.map((item) => ({ item, progress: progressOf(item, userKey) }))
  const seen = rows.filter((r) => r.progress && r.progress.state !== 'not_started').length
  const current = rows.findIndex((r) => r.item.isCurrent)
  const next = rows.slice(current + 1).find((r) => r.item.courseKey && r.progress?.state !== 'completed')

  return (
    <section aria-label={`${c.series}: ${data.seriesName}`} className="mb-8 rounded-ase-lg border border-ase-border bg-ase-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-ase-brand" aria-hidden />
        <h2 className="text-body-sm font-semibold uppercase tracking-wide text-ase-text2">
          {c.series}: {data.seriesName}
        </h2>
        <span className="ml-auto text-caption text-ase-muted">{c.seen(seen, rows.length)}</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ item, progress }, i) => {
          const title = lang === 'en' && item.titleEn ? item.titleEn : item.title
          const playable = !!item.courseKey && !!getCourse(item.courseKey)
          const to = playable ? `/academy/${item.courseKey}` : catalogItemPath(item)
          const badge =
            progress?.state === 'completed' ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            ) : progress?.state === 'in_progress' ? (
              <Eye className="h-3.5 w-3.5" aria-hidden />
            ) : (
              (item.seriesOrder ?? i + 1)
            )
          const statusText = !playable
            ? c.soon
            : progress?.state === 'completed'
              ? c.completed
              : progress?.state === 'in_progress'
                ? c.inProgress(progress.done, progress.total)
                : c.notStarted
          const accessText = item.hasAccess ? c.owned : item.isFree ? c.free : `${c.paid} · ${formatPrice(item.price, item.currency, lang)}`
          const body = (
            <>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${
                    progress?.state === 'completed'
                      ? 'border-ase-success/40 bg-ase-success/15 text-ase-success'
                      : progress?.state === 'in_progress'
                        ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-brand'
                        : 'border-ase-border text-ase-muted'
                  }`}
                >
                  {badge}
                </span>
                <span className={`min-w-0 truncate text-body-sm ${item.isCurrent ? 'font-semibold text-ase-text' : 'text-ase-text2'}`}>{title}</span>
              </div>
              <p className="mt-1.5 text-caption text-ase-muted">
                {item.isCurrent ? <strong className="text-ase-brand">{c.here} · </strong> : null}
                {statusText}
              </p>
              <p className={`text-caption ${item.hasAccess || item.isFree ? 'text-ase-success' : 'text-ase-muted'}`}>
                {!item.hasAccess && !item.isFree ? <Lock className="mr-1 inline h-3 w-3" aria-hidden /> : null}
                {accessText}
              </p>
            </>
          )
          const cls = `block h-full rounded-ase-md border p-3 transition ${
            item.isCurrent ? 'border-ase-brand/50 bg-ase-brand/5' : 'border-ase-border bg-ase-bg2 hover:border-ase-brand/40'
          }`
          return (
            <li key={item.catalogSlug} aria-current={item.isCurrent ? 'step' : undefined}>
              {to && !item.isCurrent ? (
                <Link to={to} className={cls}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          )
        })}
      </ol>
      {next ? (
        <Link to={`/academy/${next.item.courseKey}`} className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-ase-brand hover:underline">
          {c.next}: {lang === 'en' && next.item.titleEn ? next.item.titleEn : next.item.title} <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </section>
  )
}
