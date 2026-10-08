import { CountUp } from './CountUp'
import { useHomeCopy } from './useHomeCopy'
import { useLiveStats } from './useLiveStats'

/**
 * Banda de cifras de la home. Años y proyectos son fijos; misiones, catálogo,
 * empleo y blog se calculan en vivo y se ocultan si no hay dato (o es 0).
 */
export function HomeStatsBand() {
  const s = useHomeCopy().stats
  const live = useLiveStats()
  const items: { key: string; value: number | undefined; suffix: string; label: string; live?: boolean }[] = [
    { key: 'years', value: s.years.value, suffix: s.years.suffix, label: s.years.label },
    { key: 'projects', value: s.projects.value, suffix: s.projects.suffix, label: s.projects.label },
    { key: 'missions', value: live.missions, suffix: '', label: s.missions.label, live: true },
    { key: 'catalog', value: live.catalogItems, suffix: '', label: s.catalog.label, live: true },
    { key: 'jobs', value: live.jobPostings, suffix: '', label: s.jobs.label, live: true },
    { key: 'articles', value: live.blogPosts, suffix: '', label: s.articles.label, live: true },
  ]
  const shown = items.filter((it) => (it.value ?? 0) > 0)

  return (
    <section className="relative border-y border-white/5 bg-white/[0.015]">
      <dl
        className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:grid-cols-3 sm:px-8 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ ['--cols' as string]: shown.length }}
      >
        {shown.map((it) => (
          <div key={it.key} className="px-2 py-9 text-center sm:px-4 sm:py-11">
            <dt className="sr-only">{it.label}</dt>
            <dd>
              <span className="font-display text-4xl font-semibold text-ase-text sm:text-5xl">
                <CountUp to={it.value ?? 0} />
                <span className="text-ase-brand">{it.suffix}</span>
              </span>
              <p className="mx-auto mt-3 flex max-w-[22ch] items-start justify-center gap-1.5 text-xs leading-relaxed text-ase-muted sm:text-sm">
                {it.live && (
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 motion-safe:animate-glow-pulse"
                    title={s.liveHint}
                    aria-hidden
                  />
                )}
                {it.label}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
