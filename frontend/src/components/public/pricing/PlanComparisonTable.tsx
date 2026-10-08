import { useQuery } from '@tanstack/react-query'
import { Check, Minus } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { listPlansCatalog } from '../../../api/plansCatalog.api'
import { useI18n } from '../../../i18n'
import type { Plan } from '../../../types/plan.types'
import { Skeleton } from '../../ui/Skeleton'
import { cn } from '../../ui/cn'
import { localizedPlanText } from '../pricingFromPlans'

const COPY = {
  es: {
    eyebrow: 'Comparativa',
    title: 'Qué incluye cada plan, sin letra pequeña',
    subtitle:
      'Cada dato sale de la configuración real del plan: el contenido que trae, cuánto puedes descargar al mes, qué pagas aparte y qué servicios añade.',
    groups: { access: 'Acceso', downloads: 'Descargas', purchases: 'Compras', jobs: 'Empleo', services: 'Servicios incluidos' },
    rows: {
      status: 'Disponibilidad',
      price: 'Precio',
      content: 'Contenido incluido en el plan',
      free: 'Contenido gratuito y vista previa del catálogo',
      academy: 'ASE Academy',
      downloads: 'Descargas al mes del contenido incluido',
      loyalty: 'Bono de fidelidad',
      rest: 'Resto del catálogo',
      discounts: 'Descuentos en contenido no incluido',
      ai: 'Análisis de encaje con IA',
      services: 'Servicios y extras del plan',
    },
    available: 'Disponible',
    soon: 'Próximamente',
    perMonth: '/mes',
    custom: 'A medida',
    freePrice: 'Gratis',
    onlyFree: 'Solo contenido gratuito',
    unlimited: 'Sin límite',
    perMonthCount: (n: number) => `${n} al mes`,
    loyalty: (n: number, m: number) => `+${n} cada ${m} ${m === 1 ? 'mes' : 'meses'}`,
    individual: 'Compra individual',
    discounts: (n: number, max: number) => `${n} ${n === 1 ? 'elemento' : 'elementos'}, hasta −${max}%`,
    academyFirst: 'Primera misión de cada curso',
    academyCourses: (n: number) => `Primera misión + ${n} ${n === 1 ? 'curso completo' : 'cursos completos'}`,
    types: {
      course: ['curso', 'cursos'],
      book: ['libro', 'libros'],
      resource: ['recurso', 'recursos'],
      product: ['producto', 'productos'],
    },
    recommended: 'Recomendado',
    note: 'Las descargas solo cuentan para el contenido incluido en el plan: lo que compras aparte y el contenido gratuito no consumen cupo.',
  },
  en: {
    eyebrow: 'Comparison',
    title: 'What each plan includes, no fine print',
    subtitle:
      "Every figure comes from the plan's real configuration: the content it includes, how much you can download per month, what you pay for separately and which services it adds.",
    groups: { access: 'Access', downloads: 'Downloads', purchases: 'Purchases', jobs: 'Jobs', services: 'Included services' },
    rows: {
      status: 'Availability',
      price: 'Price',
      content: 'Content included in the plan',
      free: 'Free content and catalog previews',
      academy: 'ASE Academy',
      downloads: 'Monthly downloads of included content',
      loyalty: 'Loyalty bonus',
      rest: 'Rest of the catalog',
      discounts: 'Discounts on content not included',
      ai: 'AI fit analysis',
      services: 'Plan services and extras',
    },
    available: 'Available',
    soon: 'Coming soon',
    perMonth: '/mo',
    custom: 'Custom',
    freePrice: 'Free',
    onlyFree: 'Free content only',
    unlimited: 'Unlimited',
    perMonthCount: (n: number) => `${n} per month`,
    loyalty: (n: number, m: number) => `+${n} every ${m} ${m === 1 ? 'month' : 'months'}`,
    individual: 'Individual purchase',
    discounts: (n: number, max: number) => `${n} ${n === 1 ? 'item' : 'items'}, up to −${max}%`,
    academyFirst: 'First mission of every course',
    academyCourses: (n: number) => `First mission + ${n} full ${n === 1 ? 'course' : 'courses'}`,
    types: {
      course: ['course', 'courses'],
      book: ['book', 'books'],
      resource: ['resource', 'resources'],
      product: ['product', 'products'],
    },
    recommended: 'Recommended',
    note: 'Downloads only count for content included in the plan: what you buy separately and free content never use up your allowance.',
  },
} as const

type Copy = (typeof COPY)['es'] | (typeof COPY)['en']

function money(value: string | number, currency: string, language: string) {
  const n = Number(value)
  return new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n)
}

function contentBreakdown(plan: Plan, c: Copy): string | null {
  const items = plan.included_catalog_items ?? []
  if (items.length === 0) return null
  const counts = new Map<string, number>()
  for (const it of items) counts.set(it.type, (counts.get(it.type) ?? 0) + 1)
  return (['course', 'book', 'resource', 'product'] as const)
    .filter((tp) => counts.has(tp))
    .map((tp) => {
      const n = counts.get(tp)!
      return `${n} ${c.types[tp][n === 1 ? 0 : 1]}`
    })
    .join(' · ')
}

const No = () => <Minus className="mx-auto h-4 w-4 text-ase-muted/60" aria-label="—" />
const Yes = () => <Check className="mx-auto h-4 w-4 text-emerald-400" aria-label="✓" />

/**
 * Tabla comparativa de planes generada desde la base de datos (catálogo
 * público de planes): nada de lo que muestra está escrito a mano.
 */
export function PlanComparisonTable() {
  const { language } = useI18n()
  const lang = language === 'en' ? 'en' : 'es'
  const c: Copy = lang === 'en' ? COPY.en : COPY.es
  const query = useQuery({ queryKey: ['plans', 'public-catalog'], queryFn: listPlansCatalog, staleTime: 5 * 60_000 })
  const plans = (query.data ?? [])
    .filter((p) => p.is_active !== false && p.status !== 'inactive')
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }
  if (plans.length === 0) return null

  const name = (p: Plan) => localizedPlanText(lang, p.name, p.name_en)
  const cell = (p: Plan, render: (p: Plan) => ReactNode) => (
    <td
      key={p.id}
      className={cn(
        'px-4 py-3.5 text-center align-top text-sm text-ase-text2',
        p.is_recommended && 'bg-ase-brand/[0.06]',
      )}
    >
      {render(p)}
    </td>
  )

  const groups: { title: string; rows: { label: string; render: (p: Plan) => ReactNode }[] }[] = [
    {
      title: c.groups.access,
      rows: [
        {
          label: c.rows.status,
          render: (p) =>
            p.status === 'coming_soon' ? (
              <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                {c.soon}
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
                {c.available}
              </span>
            ),
        },
        {
          label: c.rows.content,
          render: (p) => {
            const b = contentBreakdown(p, c)
            return b ? (
              <span className="font-semibold text-ase-text">{b}</span>
            ) : (
              <span className="text-ase-muted">{c.onlyFree}</span>
            )
          },
        },
        { label: c.rows.free, render: () => <Yes /> },
        {
          label: c.rows.academy,
          render: (p) => {
            const n = (p.included_catalog_items ?? []).filter((it) => it.type === 'course').length
            return n > 0 ? c.academyCourses(n) : c.academyFirst
          },
        },
      ],
    },
    {
      title: c.groups.downloads,
      rows: [
        {
          label: c.rows.downloads,
          render: (p) =>
            (p.included_catalog_items ?? []).length === 0 ? (
              <No />
            ) : p.monthly_download_limit == null ? (
              <span className="font-semibold text-ase-text">{c.unlimited}</span>
            ) : (
              <span className="font-semibold text-ase-text">{c.perMonthCount(p.monthly_download_limit)}</span>
            ),
        },
        {
          label: c.rows.loyalty,
          render: (p) =>
            p.loyalty_bonus_downloads && p.loyalty_bonus_interval_months ? (
              c.loyalty(p.loyalty_bonus_downloads, p.loyalty_bonus_interval_months)
            ) : (
              <No />
            ),
        },
      ],
    },
    {
      title: c.groups.purchases,
      rows: [
        { label: c.rows.rest, render: () => c.individual },
        {
          label: c.rows.discounts,
          render: (p) => {
            const d = p.discount_items ?? []
            if (d.length === 0) return <No />
            const max = Math.max(...d.map((x) => Number(x.discount_percent)))
            return c.discounts(d.length, Number.isInteger(max) ? max : Number(max.toFixed(1)))
          },
        },
      ],
    },
    {
      title: c.groups.jobs,
      rows: [
        {
          label: c.rows.ai,
          render: (p) =>
            p.monthly_ai_analysis_limit == null ? (
              <span className="font-semibold text-ase-text">{c.unlimited}</span>
            ) : (
              c.perMonthCount(p.monthly_ai_analysis_limit)
            ),
        },
      ],
    },
    {
      title: c.groups.services,
      rows: [
        {
          label: c.rows.services,
          render: (p) => {
            const f = (p.features ?? []).filter((x) => x.is_active !== false && x.text?.trim())
            if (f.length === 0) return <No />
            return (
              <ul className="space-y-1 text-left text-xs leading-relaxed">
                {f
                  .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                  .map((x) => (
                    <li key={`${x.id}-${x.text}`} className="flex gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" aria-hidden />
                      <span>{x.text}</span>
                    </li>
                  ))}
              </ul>
            )
          },
        },
      ],
    },
  ]

  return (
    <section id="comparativa" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <p className="flex items-center gap-2.5 text-label font-semibold uppercase text-sky-300">
          <span className="h-px w-8 bg-sky-400/60" />
          {c.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ase-text2">{c.subtitle}</p>

        <div className="mt-10 overflow-x-auto rounded-3xl border border-white/10 bg-ase-surface/80">
          <table className="w-full min-w-[760px] border-collapse sm:min-w-[860px]">
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className="sticky left-0 z-10 w-36 bg-ase-surface px-3 py-5 text-left sm:w-64 sm:px-5" />
                {plans.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className={cn('px-4 py-5 text-center align-bottom', p.is_recommended && 'bg-ase-brand/[0.08]')}
                  >
                    {p.is_recommended ? (
                      <span className="mb-2 inline-flex rounded-full bg-ase-brand/25 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100">
                        {c.recommended}
                      </span>
                    ) : null}
                    <span className="block font-display text-lg font-semibold text-ase-text">{name(p)}</span>
                    <span className="mt-1 block text-sm text-ase-text2">
                      {p.price == null ? (
                        c.custom
                      ) : Number(p.price) === 0 ? (
                        c.freePrice
                      ) : (
                        <>
                          <span className="font-semibold text-ase-text">{money(p.price, p.currency || 'EUR', lang)}</span>
                          {c.perMonth}
                        </>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.title}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={plans.length + 1}
                      className="sticky left-0 bg-white/[0.03] px-5 pb-2 pt-5 text-left text-label font-semibold uppercase text-ase-muted"
                    >
                      {g.title}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-white/[0.06]">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 w-36 bg-ase-surface px-3 py-3.5 text-left align-top text-xs font-medium text-ase-text sm:w-64 sm:px-5 sm:text-sm"
                      >
                        {r.label}
                      </th>
                      {plans.map((p) => cell(p, r.render))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ase-muted">{c.note}</p>
      </div>
    </section>
  )
}
