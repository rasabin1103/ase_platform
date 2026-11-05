import { useEffect, useState, type CSSProperties } from 'react'
import { ButtonLink } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { usePrefersReducedMotion } from '../../../utils/usePrefersReducedMotion'
import { ACCENTS } from './accents'
import { ExplodedStack } from './ExplodedStack'
import { SERVICE_ICON } from './layerIcons'
import { useConsultingCopy } from './useConsultingCopy'

/** Cabecera: los cuatro servicios apilados que se abren solos al cargar. */
export function ServicesHero() {
  const copy = useConsultingCopy()
  const { hero, services } = copy
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 350)
    return () => window.clearTimeout(id)
  }, [])

  const exploded = open || reduced

  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20 lg:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] opacity-70">
        <div className="absolute left-1/2 top-10 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-ase-brand/15 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2.5">
            <span className="h-px w-8 bg-ase-brand/60" />
            <span className="text-label font-semibold uppercase text-ase-brand">{hero.eyebrow}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-ase-text sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ase-text2 sm:text-lg">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/contact">{hero.cta}</ButtonLink>
            <ButtonLink to="/services" variant="secondary">
              {hero.ctaSecondary}
            </ButtonLink>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-label={hero.stackLabel}>
            {services.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(-1)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(-1)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold text-ase-text transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60',
                    active === i ? ACCENTS[s.accent].ring : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                  )}
                >
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', ACCENTS[s.accent].dot)} aria-hidden />
                  {s.short}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 hidden text-xs text-ase-muted lg:block">{hero.hint}</p>
        </div>

        <div className="min-w-0" style={{ '--p': exploded ? 1 : 0 } as CSSProperties}>
          <ExplodedStack
            eased={!reduced}
            active={active}
            layers={services.map((s) => ({ tag: s.eyebrow, title: s.short, accent: s.accent, icon: SERVICE_ICON[s.id] }))}
          />
        </div>
      </div>
    </section>
  )
}
