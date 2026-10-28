import { useAcademyResume } from './useAcademyResume'

const COPY = {
  es: { mission: 'Misión', of: (d: number, t: number) => `${d}/${t} misiones`, done: 'Curso completado' },
  en: { mission: 'Mission', of: (d: number, t: number) => `${d}/${t} missions`, done: 'Course completed' },
}

/**
 * Línea de progreso de un curso de ASE Academy para el «Continúa donde lo
 * dejaste» del panel: misiones completadas, barra y la misión en la que sigue.
 */
export function AcademyResumeLine({ courseKey, lang }: { courseKey: string; lang: 'es' | 'en' }) {
  const resume = useAcademyResume(courseKey)
  if (!resume) return null
  const c = COPY[lang]
  const { progress } = resume
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
  return (
    <div className="mt-1">
      <p className="truncate text-[11px] text-ase-muted">
        {progress.complete ? c.done : `${c.of(progress.done, progress.total)}${progress.next ? ` · ${c.mission} ${progress.next.index}: ${progress.next.title}` : ''}`}
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
        <div className="h-full rounded-full bg-ase-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
