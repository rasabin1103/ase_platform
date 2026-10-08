import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Code2,
  Gamepad2,
  Library,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react'
import { ButtonLink } from '../../ui/Button'
import { SectionNav } from '../home/SectionNav'
import { useIncludedCopy } from './useIncludedCopy'

const SECTION_IDS = [
  'catalog',
  'academy',
  'books',
  'code',
  'jobs',
  'orgs',
  'community',
  'loyalty',
  'consulting',
  'compare',
] as const
type SectionId = (typeof SECTION_IDS)[number]

const MODULE_ICONS: Record<Exclude<SectionId, 'compare'>, typeof Library> = {
  catalog: Library,
  academy: Gamepad2,
  books: BookOpen,
  code: Code2,
  jobs: Briefcase,
  orgs: Building2,
  community: MessagesSquare,
  loyalty: Award,
  consulting: ShieldCheck,
}

export function IncludedHero() {
  const c = useIncludedCopy()
  const h = c.hero
  const modules = (Object.keys(MODULE_ICONS) as Exclude<SectionId, 'compare'>[]).map((id) => ({
    id,
    Icon: MODULE_ICONS[id],
    label: c.nav[id],
    enterprise: id === 'consulting',
  }))

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-ase-brand/25 blur-[120px] motion-safe:animate-home-drift" />
        <div
          className="absolute -right-24 top-32 h-[28rem] w-[28rem] rounded-full bg-ase-brand-strong/20 blur-[120px] motion-safe:animate-home-drift"
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

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div className="min-w-0">
          <div className="inline-flex animate-fade-in-up items-center gap-2.5">
            <span className="h-px w-8 bg-ase-brand/60" />
            <span className="text-label font-semibold uppercase text-ase-brand">{h.eyebrow}</span>
          </div>
          <h1
            className="mt-6 animate-fade-in-up font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ase-text sm:text-display-lg lg:text-display-xl"
            style={{ animationDelay: '80ms' }}
          >
            {h.titleBefore} <span className="ase-text-gradient">{h.titleHighlight}</span> {h.titleAfter}
          </h1>
          <p
            className="mt-7 max-w-[54ch] animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            {h.subtitle}
          </p>
          <div className="mt-9 flex animate-fade-in-up flex-col gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <ButtonLink to="/pricing" size="lg" className="w-full sm:w-auto">
              {h.primaryCta}
            </ButtonLink>
            <ButtonLink
              to="/academy"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              leftIcon={<Gamepad2 className="h-4 w-4" aria-hidden />}
            >
              {h.secondaryCta}
            </ButtonLink>
          </div>
        </div>

        {/* «Recibo» de la suscripción: cada módulo enlaza a su sección. */}
        <div className="relative mx-auto w-full max-w-[520px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div aria-hidden className="absolute inset-6 -z-10 rounded-[2.5rem] bg-ase-brand/20 blur-3xl" />
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/85 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-4 border-b border-white/[0.07] px-6 py-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl ase-gradient-brand text-white shadow-brand">
                <span className="font-display text-base font-semibold">ASE</span>
              </span>
              <div>
                <p className="font-semibold text-ase-text">{h.cardTitle}</p>
                <p className="text-xs text-ase-muted">{h.cardSubtitle}</p>
              </div>
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {modules.map(({ id, Icon, label, enterprise }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="group flex items-center gap-3 px-6 py-3 transition hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                    <span className="flex-1 text-sm text-ase-text2 group-hover:text-ase-text">{label}</span>
                    {enterprise ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        {h.enterprise}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {h.included}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Navegación fija por secciones de «Qué incluye». */
export function IncludedSectionNav() {
  const c = useIncludedCopy()
  return <SectionNav label={c.nav.label} items={SECTION_IDS.map((id) => ({ id, label: c.nav[id] }))} />
}
