import type { ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ArrowRight, BookOpen, FileText, Headphones, Smartphone, Tablet } from 'lucide-react'
import { listCatalogShowcaseItems, type CatalogItemType } from '../../../api/catalogShowcase.api'
import { ACADEMY_COURSES } from '../../../features/academy/content/courseList'
import { useI18n } from '../../../i18n'
import { ButtonLink } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { FeatureGrid, FeatureSection, VisualFrame } from './IncludedShared'
import { useIncludedCopy } from './useIncludedCopy'

/* ─────────────────────────── Catálogo ─────────────────────────── */

const CATALOG_TYPES: { type: CatalogItemType; color: string }[] = [
  { type: 'course', color: '#4C7DFF' },
  { type: 'book', color: '#A78BFA' },
  { type: 'product', color: '#22D3EE' },
  { type: 'resource', color: '#F5B454' },
]

export function IncludedCatalog() {
  const c = useIncludedCopy().catalog
  const { t } = useI18n()
  // Recuento real por tipo (limit 1: solo nos interesa `total`).
  const results = useQueries({
    queries: CATALOG_TYPES.map(({ type }) => ({
      queryKey: ['included', 'catalog-count', type],
      queryFn: () => listCatalogShowcaseItems({ type, limit: 1 }),
      staleTime: 10 * 60_000,
    })),
  })
  const ready = results.every((r) => r.isSuccess)
  const rows = CATALOG_TYPES.map((ct, i) => ({
    ...ct,
    label: t(`publicCatalogShowcase.type.${ct.type}`),
    count: results[i].data?.total ?? 0,
  }))
  const total = rows.reduce((n, r) => n + r.count, 0)
  const max = Math.max(1, ...rows.map((r) => r.count))

  const visual = (
    <VisualFrame
      title={c.chartTitle}
      badge={
        ready && total > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-glow-pulse" />
            {c.chartLive}
          </span>
        ) : null
      }
    >
      {ready && total > 0 ? (
        <>
          <p className="font-display text-5xl font-semibold text-ase-text">
            {total}
            <span className="ml-3 align-middle font-sans text-sm font-normal text-ase-muted">{c.total}</span>
          </p>
          {/* Barra apilada con la composición. */}
          <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
            {rows.map((r) => (
              <div key={r.type} style={{ width: `${(r.count / total) * 100}%`, backgroundColor: r.color }} />
            ))}
          </div>
          <ul className="mt-7 space-y-4">
            {rows.map((r) => (
              <li key={r.type}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-ase-text2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color }} aria-hidden />
                    {r.label}
                  </span>
                  <span className="font-semibold tabular-nums text-ase-text">{r.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(r.count / max) * 100}%`, backgroundColor: r.color, opacity: 0.85 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
              <p className="mt-4 text-sm font-semibold text-ase-text">{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </VisualFrame>
  )

  return (
    <FeatureSection id="catalog" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual}>
      <FeatureGrid items={c.features} />
      <ButtonLink
        to="/catalog"
        variant="secondary"
        className="mt-8"
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
      >
        {c.cta}
      </ButtonLink>
    </FeatureSection>
  )
}

/* ─────────────────────────── Academy ─────────────────────────── */

export function IncludedAcademy() {
  const c = useIncludedCopy().academy

  const visual = (
    <VisualFrame title={c.mapTitle}>
      <div className="space-y-7">
        {ACADEMY_COURSES.map((course) => {
          const playable = course.missions.filter((m) => m.available).length
          return (
            <div key={course.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-ase-text">{course.title}</p>
                <span className="shrink-0 text-xs text-ase-muted">
                  {playable}/{course.missions.length} {c.missions}
                </span>
              </div>
              <ol className="mt-8 flex items-center" aria-label={course.title}>
                {course.missions.map((m, i) => (
                  <li key={m.id} className="flex flex-1 items-center last:flex-none">
                    <span
                      title={m.title}
                      className={cn(
                        'relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                        m.available
                          ? 'ase-gradient-brand text-white shadow-brand'
                          : 'border border-dashed border-white/20 text-ase-muted',
                      )}
                    >
                      {i}
                      {i === 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-400/15 px-1.5 text-[9px] font-semibold uppercase text-emerald-300">
                          {c.free}
                        </span>
                      )}
                      <span className="sr-only">
                        {m.title} · {m.available ? c.available : c.soon}
                      </span>
                    </span>
                    {i < course.missions.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          'mx-1 h-0.5 flex-1 rounded-full',
                          m.available && course.missions[i + 1].available ? 'bg-ase-brand/70' : 'bg-white/10',
                        )}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>
      <div className="mt-7 flex gap-5 border-t border-white/[0.07] pt-5 text-xs text-ase-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full ase-gradient-brand" aria-hidden />
          {c.available}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-dashed border-white/30" aria-hidden />
          {c.soon}
        </span>
      </div>
    </VisualFrame>
  )

  return (
    <FeatureSection
      id="academy"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      visual={visual}
      reverse
      tinted
    >
      <FeatureGrid items={c.features} />
      <ButtonLink to="/academy" className="mt-8">
        {c.cta}
      </ButtonLink>
    </FeatureSection>
  )
}

/* ─────────────────────────── Libros ─────────────────────────── */

const FORMAT_ICONS = [FileText, Tablet, Smartphone, Headphones]

export function IncludedBooks() {
  const c = useIncludedCopy().books

  const visual = (
    <div className="relative mx-auto max-w-[520px]">
      <div aria-hidden className="absolute inset-10 -z-10 rounded-full bg-ase-brand-strong/20 blur-3xl" />
      <div className="grid grid-cols-[auto_1fr] items-center gap-6">
        {/* Portada */}
        <div className="relative h-56 w-40 rotate-[-4deg] rounded-r-xl rounded-l-sm ase-gradient-brand p-4 shadow-[0_30px_60px_-20px_rgba(76,125,255,0.6)] sm:h-64 sm:w-44">
          <span aria-hidden className="absolute inset-y-0 left-0 w-2 rounded-l-sm bg-black/25" />
          <BookOpen className="h-5 w-5 text-white/80" aria-hidden />
          <p className="mt-6 font-display text-xl font-semibold leading-tight text-white">{c.coverTitle}</p>
          <p className="absolute bottom-4 left-4 text-[11px] font-semibold uppercase tracking-widest text-white/70">
            {c.coverAuthor}
          </p>
        </div>
        {/* Formatos */}
        <ul className="space-y-3">
          {c.formats.map((f, i) => {
            const Icon = FORMAT_ICONS[i]
            return (
              <li
                key={f.name}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ase-surface/80 px-4 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ase-text">{f.name}</p>
                  <p className="truncate text-xs text-ase-muted">{f.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )

  return (
    <FeatureSection id="books" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual}>
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="font-semibold text-ase-text">{c.redeemTitle}</p>
          <p className="mt-1 text-sm text-ase-text2">{c.redeemText}</p>
        </div>
        <ButtonLink to="/redeem" variant="secondary" className="mt-4 shrink-0 sm:mt-0">
          {c.redeemCta}
        </ButtonLink>
      </div>
    </FeatureSection>
  )
}

/* ─────────────────────── Scripts y frameworks ─────────────────────── */

const FRAMEWORKS = ['Playwright', 'Karate', 'Pytest', 'WebdriverIO']

export function IncludedCode() {
  const c = useIncludedCopy().code
  const serial = 48
  const parallel = 13

  const visual = (
    <div className="space-y-5">
      <VisualFrame
        title={c.viewerTitle}
        badge={<span className="font-mono text-[11px] text-ase-muted">checkout.spec.ts</span>}
      >
        <pre className="overflow-x-auto font-mono text-[12px] leading-6 text-ase-text2">
          <code>
            <Line n={1}>
              <K>import</K> {'{ test, expect }'} <K>from</K> <S>'@playwright/test'</S>
            </Line>
            <Line n={2}> </Line>
            <Line n={3}>
              <F>test</F>(<S>'pago con importe límite'</S>, <K>async</K> ({'{ page }'}) =&gt; {'{'}
            </Line>
            <Line n={4}>
              {'  '}
              <K>await</K> page.<F>goto</F>(<S>'/checkout'</S>)
            </Line>
            <Line n={5}>
              {'  '}
              <K>await</K> page.<F>getByLabel</F>(<S>'Importe'</S>).<F>fill</F>(<S>'3000'</S>)
            </Line>
            <Line n={6}>
              {'  '}
              <K>await</K> <F>expect</F>(page.<F>getByText</F>(<S>'Doble aprobación'</S>)).<F>toBeVisible</F>()
            </Line>
            <Line n={7}>{'})'}</Line>
          </code>
        </pre>
      </VisualFrame>

      <div className="rounded-3xl border border-white/10 bg-ase-surface/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{c.chartTitle}</p>
        <div className="mt-4 space-y-3">
          <Bar label={c.chartSerial} value={serial} max={serial} unit={c.chartUnit} color="bg-white/25" />
          <Bar label={c.chartParallel} value={parallel} max={serial} unit={c.chartUnit} color="bg-cyan-400" />
        </div>
        <p className="mt-4 text-[11px] text-ase-muted">{c.chartNote}</p>
      </div>
    </div>
  )

  return (
    <FeatureSection id="code" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual} reverse tinted>
      <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{c.frameworks}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FRAMEWORKS.map((f) => (
          <span
            key={f}
            className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-3.5 py-2 font-mono text-sm text-cyan-100"
          >
            {f}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {c.pills.map((p) => (
          <span
            key={p}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ase-text2"
          >
            {p}
          </span>
        ))}
      </div>
    </FeatureSection>
  )
}

function Line({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="block whitespace-pre">
      <span className="mr-4 inline-block w-4 select-none text-right text-ase-muted/50">{n}</span>
      {children}
    </span>
  )
}
const K = ({ children }: { children: ReactNode }) => <span className="text-violet-300">{children}</span>
const S = ({ children }: { children: ReactNode }) => <span className="text-emerald-300">{children}</span>
const F = ({ children }: { children: ReactNode }) => <span className="text-sky-300">{children}</span>

function Bar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string
  value: number
  max: number
  unit: string
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-ase-text2">{label}</span>
        <span className="font-semibold tabular-nums text-ase-text">
          {value} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}
