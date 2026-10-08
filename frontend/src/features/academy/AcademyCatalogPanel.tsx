import { CheckCircle2, Clock, Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { courseSyllabus } from './syllabus'

const COPY = {
  es: { missions: 'Misiones del curso', ready: 'Disponible', soon: 'Próximamente', free: 'Gratis', count: (a: number, n: number) => `${a} de ${n} disponibles` },
  en: { missions: 'Course missions', ready: 'Available', soon: 'Coming soon', free: 'Free', count: (a: number, n: number) => `${a} of ${n} available` },
} as const

/**
 * Bloque que aparece en la ficha de un ítem del catálogo vinculado a un
 * curso del simulador (CatalogItem.academy_course_key). El temario sale de
 * las misiones reales del curso, así que siempre coincide con lo que
 * muestra ASE Academy.
 */
export function AcademyCatalogPanel({
  courseKey,
  owned,
  t,
}: {
  courseKey: string
  owned: boolean
  t: (key: string) => string
}) {
  const { language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es
  const missions = courseSyllabus(courseKey)
  const available = missions.filter((m) => m.available).length

  return (
    <div className="rounded-3xl border border-ase-brand/30 bg-ase-brand/[0.05] p-5 sm:p-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-300">
        <Gamepad2 className="h-4 w-4" aria-hidden /> {t('catalog.academy.badge')}
      </p>
      <h2 className="mt-2 font-display text-lg font-semibold text-ase-text">{t('catalog.academy.title')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ase-text2">{t('catalog.academy.body')}</p>

      {missions.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ase-text">{c.missions}</p>
            <p className="text-xs text-ase-muted">{c.count(available, missions.length)}</p>
          </div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {missions.map((m, i) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-ase-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ase-text">{m.title}</span>
                {m.free ? (
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                    {c.free}
                  </span>
                ) : null}
                {m.available ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label={c.ready} />
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-amber-200">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {c.soon}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <Link
        to={`/academy/${courseKey}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl ase-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
      >
        {owned ? t('catalog.academy.play') : t('catalog.academy.demo')}
      </Link>
    </div>
  )
}
