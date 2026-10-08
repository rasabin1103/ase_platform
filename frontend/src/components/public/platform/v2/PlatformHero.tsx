import { ArrowRight, Fingerprint, Globe2, KeyRound, Network } from 'lucide-react'
import { ButtonLink } from '../../../ui/Button'
import { usePrefersReducedMotion } from '../../../../utils/usePrefersReducedMotion'
import { usePlatformCopy } from './usePlatformCopy'

const PRINCIPLE_ICONS = [Network, KeyRound, Fingerprint, Globe2]

export function PlatformHero() {
  const h = usePlatformCopy().hero
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-ase-brand/25 blur-[120px] motion-safe:animate-home-drift" />
        <div
          className="absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-[120px] motion-safe:animate-home-drift"
          style={{ animationDelay: '-9s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        <div className="min-w-0">
          <div className="inline-flex animate-fade-in-up items-center gap-2.5">
            <span className="h-px w-8 bg-ase-brand/60" />
            <span className="text-label font-semibold uppercase text-ase-brand">{h.eyebrow}</span>
          </div>
          <h1
            className="mt-6 animate-fade-in-up font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ase-text sm:text-display-lg lg:text-display-xl"
            style={{ animationDelay: '80ms' }}
          >
            {h.titleBefore} <span className="ase-text-gradient">{h.titleHighlight}</span>
            {h.titleAfter}
          </h1>
          <p
            className="mt-7 max-w-[54ch] animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            {h.subtitle}
          </p>
          <div className="mt-9 flex animate-fade-in-up flex-col gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <ButtonLink
              to="/services"
              size="lg"
              className="w-full sm:w-auto"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
            >
              {h.primaryCta}
            </ButtonLink>
            <ButtonLink to="/contact" size="lg" variant="secondary" className="w-full sm:w-auto">
              {h.secondaryCta}
            </ButtonLink>
          </div>
        </div>

        <CoreOrbit core={h.core} coreSub={h.coreSub} nodes={h.orbit} />
      </div>

      {/* Principios */}
      <div className="border-y border-white/5 bg-white/[0.015]">
        <ul className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px px-5 sm:px-8 lg:grid-cols-4">
          {h.principles.map((p, i) => {
            const Icon = PRINCIPLE_ICONS[i]
            return (
              <li key={p.label} className="flex items-start gap-3 px-2 py-7 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ase-text">{p.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ase-muted">{p.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** Núcleo con los módulos en órbita, unidos por líneas con pulsos de datos. */
function CoreOrbit({ core, coreSub, nodes }: { core: string; coreSub: string; nodes: string[] }) {
  const reduced = usePrefersReducedMotion()
  const R = 40 // radio en % del contenedor
  const points = nodes.map((label, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
    return { label, x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }
  })

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[520px] animate-fade-in-up"
      style={{ animationDelay: '200ms' }}
    >
      <div aria-hidden className="absolute inset-[18%] -z-10 rounded-full bg-ase-brand/25 blur-3xl" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        <circle
          cx="50"
          cy="50"
          r={R * 0.55}
          fill="none"
          stroke="rgba(76,125,255,0.15)"
          strokeWidth="0.3"
          strokeDasharray="1 1.5"
        />
        {points.map((p, i) => (
          <g key={p.label}>
            <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="rgba(76,125,255,0.28)" strokeWidth="0.3" />
            {!reduced && (
              <circle r="0.9" fill="#7dd3fc">
                <animate
                  attributeName="cx"
                  values={`50;${p.x}`}
                  dur="3.2s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values={`50;${p.y}`}
                  dur="3.2s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="3.2s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        ))}
      </svg>

      {/* Núcleo */}
      <div className="absolute left-1/2 top-1/2 grid h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ase-gradient-brand text-center shadow-[0_0_60px_rgba(76,125,255,0.55)] ring-8 ring-ase-brand/15">
        <div>
          <p className="font-display text-lg font-semibold text-white sm:text-2xl">{core}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/75 sm:text-[11px]">{coreSub}</p>
        </div>
      </div>

      {/* Nodos */}
      {points.map((p) => (
        <span
          key={p.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/12 bg-ase-surface px-2.5 py-1 text-[11px] font-semibold text-ase-text2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] sm:px-3.5 sm:py-1.5 sm:text-xs"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.label}
        </span>
      ))}
    </div>
  )
}
