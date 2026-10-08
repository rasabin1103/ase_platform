import { useQuery } from '@tanstack/react-query'
import { Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listAcademyRuns } from './api'
import { getCourse } from './content/courseList'

const COPY = {
  es: { missions: (d: number, n: number) => `${d}/${n} misiones`, start: 'Empezar curso', next: 'Continuar misión', review: 'Repasar curso' },
  en: { missions: (d: number, n: number) => `${d}/${n} missions`, start: 'Start course', next: 'Continue mission', review: 'Review course' },
} as const

/**
 * Progreso de un curso de ASE Academy dentro de la biblioteca: misiones
 * terminadas y enlace directo a la siguiente misión pendiente.
 */
export function AcademyCourseProgress({ courseKey, language }: { courseKey: string; language: string }) {
  const c = language === 'en' ? COPY.en : COPY.es
  const course = getCourse(courseKey)
  const runs = useQuery({
    queryKey: ['academy-runs', courseKey],
    queryFn: () => listAcademyRuns(courseKey),
    enabled: Boolean(course),
    staleTime: 60_000,
  })
  if (!course) return null

  const playable = course.missions.filter((m) => m.available)
  const finished = new Set((runs.data ?? []).filter((r) => r.finished).map((r) => r.missionId))
  const done = playable.filter((m) => finished.has(m.id)).length
  const next = playable.find((m) => !finished.has(m.id))
  const started = (runs.data ?? []).length > 0
  const to = next ? `/academy/${courseKey}/${next.id}` : `/academy/${courseKey}`
  const label = !next ? c.review : started ? c.next : c.start
  const pct = playable.length ? Math.round((done / playable.length) * 100) : 0

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wide text-violet-200">
          <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
          ASE Academy
        </span>
        <span className="whitespace-nowrap tabular-nums text-ase-text2">{c.missions(done, playable.length)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
        <div className="h-full rounded-full bg-violet-400" style={{ width: `${pct}%` }} />
      </div>
      <Link
        to={to}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      >
        {label}
      </Link>
    </div>
  )
}
