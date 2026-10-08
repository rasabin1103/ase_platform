import { useEffect, useState } from 'react'
import { cn } from '../../../ui/cn'
import { ButtonLink } from '../../../ui/Button'
import { usePrefersReducedMotion } from '../../../../utils/usePrefersReducedMotion'
import { Reveal, SectionHeading } from '../../home/Reveal'
import { FeatureSection, VisualFrame } from '../../included/IncludedShared'
import { usePlatformCopy } from './usePlatformCopy'

/* ─────────────────────────── Auditoría ─────────────────────────── */

const TONES: Record<string, string> = {
  brand: 'bg-ase-brand',
  emerald: 'bg-emerald-400',
  cyan: 'bg-cyan-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
}

export function PlatformAudit() {
  const c = usePlatformCopy().audit
  const reduced = usePrefersReducedMotion()
  const [offset, setOffset] = useState(0)

  // Simula un flujo en directo: rota los eventos cada pocos segundos.
  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setOffset((o) => (o + 1) % c.events.length), 2800)
    return () => window.clearInterval(id)
  }, [reduced, c.events.length])

  const rows = Array.from({ length: 5 }, (_, i) => c.events[(offset + c.events.length - i) % c.events.length])

  const visual = (
    <VisualFrame
      title={c.streamTitle}
      badge={
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-glow-pulse" />
          {c.live}
        </span>
      }
    >
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={`${offset}-${i}`}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3',
              i === 0 && !reduced && 'animate-fade-in-up border-ase-brand/30 bg-ase-brand/[0.06]',
            )}
            style={{ opacity: 1 - i * 0.14 }}
          >
            <span className={cn('h-2 w-2 shrink-0 rounded-full', TONES[r.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-ase-text">{r.event}</span>
            <span className="hidden text-xs text-ase-muted sm:inline">{r.actor}</span>
            <span className="w-20 text-right font-mono text-[11px] text-ase-muted">{c.ago[i]}</span>
          </li>
        ))}
      </ul>
    </VisualFrame>
  )

  return (
    <FeatureSection id="audit" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual}>
      <div className="grid grid-cols-2 gap-3">
        {c.indicators.map((it) => (
          <div
            key={it}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            <span className="text-sm text-ase-text2">{it}</span>
          </div>
        ))}
      </div>
    </FeatureSection>
  )
}

/* ─────────────────────────── Automatización ─────────────────────────── */

const STAGE_COLORS = ['text-sky-300', 'text-violet-300', 'text-cyan-300', 'text-emerald-300']

export function PlatformAutomation() {
  const c = usePlatformCopy().automation
  return (
    <section id="automation" className="scroll-mt-32 bg-ase-bg2/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
        <Reveal delayMs={100} className="relative mt-14">
          <div aria-hidden className="absolute left-[12%] right-[12%] top-1/2 hidden h-px bg-white/10 lg:block">
            <span className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)] motion-safe:animate-flow-dot motion-reduce:hidden" />
          </div>
          <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.stages.map((s, i) => (
              <li key={s.title} className="rounded-3xl border border-white/10 bg-ase-surface/90 p-6">
                <p className={cn('font-mono text-xs font-semibold', STAGE_COLORS[i])}>0{i + 1}</p>
                <p className="mt-2 text-lg font-semibold text-ase-text">{s.title}</p>
                <ul className="mt-4 space-y-2">
                  {s.items.map((it) => (
                    <li
                      key={it}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-ase-text2"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Panel ─────────────────────────── */

const SERIES = [120, 132, 128, 150, 162, 158, 181, 196, 205, 221, 240, 262]
const MIX = [
  { color: '#94a3b8', value: 40 },
  { color: '#4C7DFF', value: 30 },
  { color: '#22D3EE', value: 20 },
  { color: '#A78BFA', value: 10 },
]

export function PlatformDashboard() {
  const c = usePlatformCopy().dashboard
  const plans = usePlatformCopy().billing.plans
  const max = Math.max(...SERIES)
  const min = Math.min(...SERIES) * 0.85
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * 100, 40 - ((v - min) / (max - min)) * 36] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L100,40 L0,40 Z`

  // Donut: desplazamiento acumulado de cada segmento.
  const r = 15.9
  const offsets = MIX.map((_, i) => MIX.slice(0, i).reduce((n, m) => n + m.value, 0))

  return (
    <section id="dashboard" className="scroll-mt-32 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
        <Reveal delayMs={100} className="mt-14">
          <VisualFrame
            title="ASE Admin"
            badge={<span className="text-[11px] uppercase tracking-wider text-ase-muted">{c.simulated}</span>}
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {c.kpis.map((k, i) => (
                <div key={k.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{k.label}</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-semibold text-ase-text">{k.value}</span>
                    {k.delta ? (
                      <span className="text-xs font-semibold text-emerald-300">{k.delta}</span>
                    ) : (
                      <span className={cn('h-2 w-2 rounded-full', i === 3 && 'bg-amber-400')} aria-hidden />
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
              {/* Área */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-xs font-semibold text-ase-text2">{c.chartTitle}</p>
                <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="mt-4 h-40 w-full" aria-hidden>
                  <defs>
                    <linearGradient id="platArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4C7DFF" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4C7DFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[10, 20, 30].map((y) => (
                    <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  ))}
                  <path d={area} fill="url(#platArea)" />
                  <path d={line} fill="none" stroke="#7dd3fc" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              {/* Donut */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-xs font-semibold text-ase-text2">{c.mixTitle}</p>
                <div className="mt-4 flex items-center gap-5">
                  <svg viewBox="0 0 42 42" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden>
                    <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    {MIX.map((m, i) => (
                      <circle
                        key={m.color}
                        cx="21"
                        cy="21"
                        r={r}
                        fill="none"
                        stroke={m.color}
                        strokeWidth="6"
                        strokeDasharray={`${m.value - 1} ${100 - m.value + 1}`}
                        strokeDashoffset={-offsets[i]}
                      />
                    ))}
                  </svg>
                  <ul className="space-y-1.5 text-xs">
                    {MIX.map((m, i) => (
                      <li key={m.color} className="flex items-center gap-2 text-ase-text2">
                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: m.color }} aria-hidden />
                        {plans[i]}
                        <span className="ml-auto pl-3 font-semibold tabular-nums text-ase-text">{m.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07]">
              <p className="bg-white/[0.03] px-5 py-3 text-xs font-semibold text-ase-text2">{c.activityTitle}</p>
              <ul className="divide-y divide-white/[0.05]">
                {c.activity.map(([ev, org, when]) => (
                  <li key={ev} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-sm">
                    <span className="truncate text-ase-text">{ev}</span>
                    <span className="text-ase-muted">{org}</span>
                    <span className="w-14 text-right font-mono text-xs text-ase-muted">{when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </VisualFrame>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Stack ─────────────────────────── */

export function PlatformStack() {
  const c = usePlatformCopy().stack
  return (
    <section id="stack" className="scroll-mt-32 bg-ase-bg2/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
        <Reveal delayMs={100} className="mx-auto mt-14 max-w-[1000px] space-y-3">
          {c.layers.map((l, i) => (
            <div
              key={l.title}
              className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-white/10 bg-ase-surface/70 p-4 sm:grid-cols-[13rem_1fr] sm:p-5"
              style={{ marginLeft: `${i * 1.5}%`, marginRight: `${i * 1.5}%` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{l.title}</p>
              <div className="flex flex-wrap gap-2">
                {l.items.map((it) => (
                  <span
                    key={it}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-ase-text"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.principles.map((p, i) => (
            <Reveal key={p.title} delayMs={i * 80}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-display text-3xl font-semibold text-ase-brand/60">0{i + 1}</span>
                <p className="mt-3 font-semibold text-ase-text">{p.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ase-text2">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Cierre ─────────────────────────── */

export function PlatformFinalCta() {
  const f = usePlatformCopy().final
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-20 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] p-px">
          <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-80" />
          <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-ase-bg px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-ase-brand/25 blur-[100px]"
            />
            <h2 className="relative mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-5xl">
              {f.title}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-base text-ase-text2 sm:text-lg">{f.subtitle}</p>
            <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/contact" size="lg">
                {f.primary}
              </ButtonLink>
              <ButtonLink to="/services" size="lg" variant="secondary">
                {f.secondary}
              </ButtonLink>
              <ButtonLink to="/login" size="lg" variant="ghost">
                {f.tertiary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
