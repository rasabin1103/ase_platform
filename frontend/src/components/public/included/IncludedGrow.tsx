import { Library, Check, Crown, Gift, LineChart, Mail, MessageCircle, Minus, Share2, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../../ui/Button'
import { useLiveStats } from '../home/useLiveStats'
import { cn } from '../../ui/cn'
import { Reveal, SectionHeading } from '../home/Reveal'
import type { Mark } from '../../../i18n/includedPage.locale'
import { ExampleNote, FeatureSection, VisualFrame } from './IncludedShared'
import { useIncludedCopy } from './useIncludedCopy'
import { useJobsEntry } from '../useJobsEntry'

/* ─────────────────────────── Empleo ─────────────────────────── */

const SCALE_COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-400']

export function IncludedJobs() {
  const c = useIncludedCopy().jobs
  const { jobPostings } = useLiveStats()
  const jobsEntry = useJobsEntry()
  const score = 82
  const r = 34
  const len = 2 * Math.PI * r

  const visual = (
    <>
      <VisualFrame title={c.reportTitle}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="url(#incFit)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - score / 100)}
              />
              <defs>
                <linearGradient id="incFit" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-bold text-ase-text">{score}%</p>
                <p className="text-[11px] font-semibold text-emerald-300">{c.level}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ase-text">{c.reportRole}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">{c.strengths}</p>
                <ul className="mt-1.5 space-y-1">
                  {c.strengthsItems.map((s) => (
                    <li key={s} className="flex gap-1.5 text-xs text-ase-text2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">{c.gaps}</p>
                <ul className="mt-1.5 space-y-1">
                  {c.gapsItems.map((s) => (
                    <li key={s} className="flex gap-1.5 text-xs text-ase-text2">
                      <Minus className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.07] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{c.keywords}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {c.keywordsMatch.map((k) => (
              <span
                key={k}
                className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200"
              >
                {k}
              </span>
            ))}
            {c.keywordsMissing.map((k) => (
              <span
                key={k}
                className="rounded-md border border-dashed border-white/20 px-2 py-0.5 text-xs text-ase-muted line-through decoration-white/30"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {c.tips}
          </p>
        </div>
      </VisualFrame>
      <ExampleNote>{c.example}</ExampleNote>
    </>
  )

  return (
    <FeatureSection id="jobs" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual}>
      {(jobPostings ?? 0) > 0 && (
        <p className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-2 text-sm text-emerald-100">
          <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-glow-pulse" aria-hidden />
          <span className="font-display text-lg font-semibold text-ase-text">{jobPostings}</span>
          {c.liveCount}
        </p>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{c.scaleTitle}</p>
      {/* Escala de niveles: segmentos proporcionales a cada rango. */}
      <div className="mt-3 flex overflow-hidden rounded-full" aria-hidden>
        {[30, 20, 25, 25].map((w, i) => (
          <span key={i} className={cn('h-2.5', SCALE_COLORS[i])} style={{ width: `${w}%`, opacity: 0.85 }} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-4 text-[11px] text-ase-muted">
        {c.scale.map((s) => (
          <li key={s.label}>
            <span className="block font-semibold text-ase-text2">{s.label}</span>
            {s.range}
          </li>
        ))}
      </ul>
      <ul className="mt-7 space-y-2.5">
        {c.bullets.map((b) => (
          <li key={b} className="flex gap-3 text-sm text-ase-text2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
      <ButtonLink to={jobsEntry.to} className="mt-8">
        {jobsEntry.label}
      </ButtonLink>
    </FeatureSection>
  )
}

/* ─────────────────────────── Organizaciones ─────────────────────────── */

const ORG_ICONS = [Library, Gift, LineChart, Mail]
const ORG_ROWS = [
  { name: 'Lucía M.', sent: 6, owned: 9 },
  { name: 'Javier R.', sent: 4, owned: 4 },
  { name: 'Marta G.', sent: 5, owned: 7 },
  { name: 'Andrés P.', sent: 2, owned: 5 },
]

export function IncludedOrgs() {
  const c = useIncludedCopy().orgs
  const max = Math.max(...ORG_ROWS.map((r) => r.owned))

  const visual = (
    <>
      <VisualFrame title={c.tableTitle}>
        <div className="grid grid-cols-[1fr_auto] gap-x-4 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
          <span>{c.tableUser}</span>
          <span className="flex gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-ase-brand" aria-hidden />
              {c.tableSent}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-white/25" aria-hidden />
              {c.tableOwned}
            </span>
          </span>
        </div>
        <ul className="mt-4 space-y-4">
          {ORG_ROWS.map((r) => (
            <li key={r.name} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
              <span className="truncate text-sm text-ase-text2">{r.name}</span>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                  style={{ width: `${(r.owned / max) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-ase-brand"
                  style={{ width: `${(r.sent / max) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs tabular-nums text-ase-muted">
                <span className="font-semibold text-ase-text">{r.sent}</span> / {r.owned}
              </span>
            </li>
          ))}
        </ul>
      </VisualFrame>
      <ExampleNote>{c.example}</ExampleNote>
    </>
  )

  return (
    <FeatureSection id="orgs" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual} reverse tinted>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {c.items.map((it, i) => {
          const Icon = ORG_ICONS[i]
          return (
            <li key={it.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Icon className="h-5 w-5 text-sky-300" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ase-text">{it.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ase-text2">{it.text}</p>
            </li>
          )
        })}
      </ul>
    </FeatureSection>
  )
}

/* ──────────────────── Comunidad + Fidelidad (fila doble) ──────────────────── */

export function IncludedCommunityLoyalty() {
  const all = useIncludedCopy()
  const c = all.community
  const { latestPost: post, blogPosts } = useLiveStats()
  const l = all.loyalty
  const levelStyles = ['text-slate-100', 'text-amber-100', 'text-cyan-50', 'text-violet-50']
  const levelColors = ['bg-slate-300/25', 'bg-amber-400/35', 'bg-cyan-300/30', 'bg-violet-400/40']

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-5 sm:px-8 lg:grid-cols-2">
        {/* Comunidad */}
        <Reveal>
          <div
            id="community"
            className="flex h-full scroll-mt-32 flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9"
          >
            <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} align="left" />
            {/* Último artículo real si lo hay; si no, el ejemplo del copy. */}
            <Link
              to={post ? `/blog/${post.slug}` : '/blog'}
              className="mt-8 block rounded-2xl border border-white/10 bg-ase-surface/80 p-5 transition hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                  {post ? (post.tags[0] ?? c.latest) : c.postTag}
                </span>
                {post && <span className="text-[11px] uppercase tracking-wide text-ase-muted">{c.latest}</span>}
              </div>
              <p className="mt-3 line-clamp-2 font-display text-lg font-semibold text-ase-text">
                {post ? post.title : c.postTitle}
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm text-ase-text2">{post ? post.excerpt : c.postExcerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-4 text-xs text-ase-muted">
                {(blogPosts ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                    <span className="font-semibold text-ase-text">{blogPosts}</span> {c.articlesCount}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  {c.share}
                  {['in', 'X', 'f', 'W'].map((sn) => (
                    <span
                      key={sn}
                      aria-hidden
                      className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.06] text-[10px] font-bold text-ase-text2"
                    >
                      {sn}
                    </span>
                  ))}
                </span>
              </div>
            </Link>
            <div className="mt-auto pt-8">
              <ButtonLink to="/blog" variant="secondary">
                {c.cta}
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        {/* Fidelidad: escalera de niveles */}
        <Reveal delayMs={100}>
          <div
            id="loyalty"
            className="flex h-full scroll-mt-32 flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9"
          >
            <SectionHeading eyebrow={l.eyebrow} title={l.title} subtitle={l.subtitle} align="left" />
            <div className="mt-auto flex items-end gap-3 pt-10" aria-label={l.levels.join(' → ')}>
              {l.levels.map((lv, i) => (
                <div key={lv} className="flex flex-1 flex-col items-center gap-3">
                  {i === l.levels.length - 1 && <Crown className="h-5 w-5 text-violet-300" aria-hidden />}
                  <div
                    className={cn(
                      'flex w-full items-end justify-center rounded-t-2xl border border-white/10 pb-3',
                      levelColors[i],
                      levelStyles[i],
                    )}
                    style={{ height: `${70 + i * 45}px` }}
                  >
                    <span className="text-xs font-bold sm:text-sm">{lv}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-ase-muted">{l.youAreHere} →</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Consultoría ─────────────────────────── */

export function IncludedConsulting() {
  const c = useIncludedCopy().consulting
  return (
    <section id="consulting" className="scroll-mt-32 bg-ase-bg2/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} align="left" />
          <Reveal className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-200">
              <Crown className="h-4 w-4" aria-hidden />
              {c.badge}
            </span>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {c.pillars.map((p, i) => (
            <Reveal key={p.title} delayMs={i * 100}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <span className="font-display text-4xl font-semibold text-ase-brand/60">0{i + 1}</span>
                <p className="mt-4 text-lg font-semibold text-ase-text">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ase-text2">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delayMs={150} className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{c.phasesTitle}</p>
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.phases.map((ph, i) => (
              <li
                key={ph}
                className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-ase-surface/70 px-4 py-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full ase-gradient-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-ase-text">{ph}</span>
              </li>
            ))}
          </ol>
          <ButtonLink to="/contact" className="mt-8">
            {c.cta}
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Comparativa ─────────────────────────── */

export function IncludedCompare() {
  const c = useIncludedCopy().compare
  return (
    <section id="compare" className="scroll-mt-32 py-20 lg:py-28">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} />
        <Reveal delayMs={100} className="mt-12">
          <div className="overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th scope="col" className="w-1/2 bg-white/[0.02] px-5 py-4 font-semibold text-ase-muted" />
                  <th scope="col" className="bg-ase-brand/[0.12] px-4 py-4 text-center font-semibold text-ase-text">
                    {c.colAse}
                  </th>
                  <th scope="col" className="bg-white/[0.02] px-4 py-4 text-center font-semibold text-ase-muted">
                    {c.colVideo}
                  </th>
                  <th scope="col" className="bg-white/[0.02] px-4 py-4 text-center font-semibold text-ase-muted">
                    {c.colLoose}
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.label} className="border-t border-white/[0.06]">
                    <th scope="row" className="px-5 py-3.5 text-left font-normal text-ase-text2">
                      {row.label}
                    </th>
                    <td className="bg-ase-brand/[0.06] px-4 py-3.5 text-center">
                      <MarkIcon mark={row.ase} partial={c.partial} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <MarkIcon mark={row.video} partial={c.partial} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <MarkIcon mark={row.loose} partial={c.partial} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function MarkIcon({ mark, partial }: { mark: Mark; partial: string }) {
  if (mark === 'yes')
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
        <Check className="h-3.5 w-3.5" aria-label="✓" />
      </span>
    )
  if (mark === 'partial') return <span className="text-xs font-semibold text-amber-300">{partial}</span>
  return (
    <span className="inline-grid h-6 w-6 place-items-center text-ase-muted/60">
      <X className="h-3.5 w-3.5" aria-label="—" />
    </span>
  )
}

/* ─────────────────────────── Cierre ─────────────────────────── */

export function IncludedFinalCta() {
  const f = useIncludedCopy().final
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-4 sm:px-8">
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
              <ButtonLink to="/pricing" size="lg">
                {f.primary}
              </ButtonLink>
              <ButtonLink to="/academy" size="lg" variant="secondary">
                {f.secondary}
              </ButtonLink>
              <ButtonLink to="/contact" size="lg" variant="ghost">
                {f.tertiary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
