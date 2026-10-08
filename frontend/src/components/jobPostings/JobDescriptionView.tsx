import { Check, Sparkles } from 'lucide-react'
import { cn } from '../ui/cn'
import type { JobFact, ParsedJobDescription } from '../../utils/jobDescription'

/** Etiquetas destacadas del anuncio («100 % remoto», «Solo USA»…). */
export function JobHighlights({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {items.map((h) => (
        <li
          key={h}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {h}
        </li>
      ))}
    </ul>
  )
}

/** Datos clave «Etiqueta: valor» en rejilla. */
export function JobFactsGrid({
  facts,
  max,
  hideMissing,
  missingLabel,
  className,
}: {
  facts: JobFact[]
  max?: number
  hideMissing?: boolean
  missingLabel: string
  className?: string
}) {
  const list = (hideMissing ? facts.filter((f) => !f.missing) : facts).slice(0, max ?? facts.length)
  if (list.length === 0) return null
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2.5', className)}>
      {list.map((f) => (
        <div key={`${f.label}-${f.value}`} className="min-w-0">
          <dt className="truncate text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{f.label}</dt>
          <dd className={cn('mt-0.5 line-clamp-2 text-sm', f.missing ? 'italic text-ase-muted' : 'text-ase-text')}>
            {f.missing ? missingLabel : f.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Descripción completa estructurada (ficha de la oferta). */
export function JobDescriptionView({
  parsed,
  missingLabel,
  factsTitle,
}: {
  parsed: ParsedJobDescription
  missingLabel: string
  factsTitle: string
}) {
  return (
    <div className="space-y-6">
      {parsed.facts.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-label font-semibold uppercase text-ase-muted">{factsTitle}</h2>
          <JobFactsGrid facts={parsed.facts} missingLabel={missingLabel} className="mt-4 sm:grid-cols-3" />
        </section>
      ) : null}
      {parsed.sections.map((s, i) => (
        <section key={`${s.heading ?? 'intro'}-${i}`}>
          {s.heading ? <h2 className="font-display text-lg font-semibold text-ase-text">{s.heading}</h2> : null}
          {s.paragraphs.map((p, j) => (
            <p key={j} className={cn('text-[15px] leading-relaxed text-ase-text2', (s.heading || j > 0) && 'mt-2')}>
              {p}
            </p>
          ))}
          {s.bullets.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {s.bullets.map((b, j) => (
                <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-ase-text2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
}
