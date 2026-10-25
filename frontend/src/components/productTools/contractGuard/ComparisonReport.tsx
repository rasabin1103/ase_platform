import { AlertTriangle, ArrowRight, Download, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CgComparisonReport, CgOverallResult, CgSeverity } from '../../../api/contractGuard.api'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { cn } from '../../ui/cn'
import {
  OVERALL_TONE,
  SEVERITY_ORDER,
  SEVERITY_TONE,
  TONE_CLASSES,
  countByCategory,
  filterFindings,
  formatDateTime,
  formatValue,
  sortFindings,
} from './contractGuard.utils'
import { useCgT } from './useCgT'

const OVERALL_ICON: Record<CgOverallResult, typeof ShieldCheck> = {
  breaking: ShieldX,
  review_required: ShieldAlert,
  compatible: ShieldCheck,
}

type Props = {
  report: CgComparisonReport
  onExport?: () => void
  exporting?: boolean
}

/** Informe de una comparación de contratos: veredicto, recuento por impacto,
 * filtros y cada hallazgo con su antes/después y la recomendación. El
 * veredicto sale de `overall_result` y los recuentos de `summary`, tal como
 * los entrega el servicio: aquí no se recalcula nada. */
export function ComparisonReport({ report, onExport, exporting }: Props) {
  const { tt, has, locale } = useCgT()
  const [severities, setSeverities] = useState<ReadonlySet<string>>(new Set())
  const [category, setCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const findings = useMemo(() => sortFindings(report.findings), [report.findings])
  const categories = useMemo(() => countByCategory(findings), [findings])
  const visible = useMemo(
    () => filterFindings(findings, { severities, category, query }),
    [findings, severities, category, query],
  )

  const Icon = OVERALL_ICON[report.overall_result] ?? ShieldAlert
  const tone = OVERALL_TONE[report.overall_result] ?? 'warning'
  const filtering = severities.size > 0 || category !== null || query.trim() !== ''

  const toggleSeverity = (s: string) =>
    setSeverities((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })

  return (
    <section aria-label={tt('compare.reportTitle')} className="space-y-5">
      {/* Veredicto */}
      <div className={cn('flex flex-wrap items-start gap-4 rounded-2xl border p-4 sm:p-5', TONE_CLASSES[tone])}>
        <Icon className="h-9 w-9 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold" role="status">
            {has(`result.${report.overall_result}`) ? tt(`result.${report.overall_result}`) : report.overall_result}
          </h3>
          <p className="mt-1 text-sm opacity-90">
            {has(`resultHint.${report.overall_result}`) ? tt(`resultHint.${report.overall_result}`) : ''}
          </p>
          {report.overall_result === 'compatible' ? (
            <p className="mt-1 text-xs opacity-75">{tt('resultHint.compatibleCaveat')}</p>
          ) : null}
        </div>
        {onExport ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            disabled={exporting}
            leftIcon={<Download className="h-4 w-4" strokeWidth={1.75} />}
          >
            {tt('compare.export')}
          </Button>
        ) : null}
      </div>

      {/* Qué se comparó */}
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Meta label={tt('compare.project')} value={report.project?.name ?? '—'} />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{tt('compare.direction')}</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 text-ase-text">
            <ContractChip label={report.baseline?.version_label} sub={report.baseline?.openapi_version} />
            <ArrowRight className="h-4 w-4 text-ase-muted" aria-label={tt('compare.to')} />
            <ContractChip label={report.candidate?.version_label} sub={report.candidate?.openapi_version} />
          </dd>
        </div>
        <Meta
          label={tt('compare.executed')}
          value={`${formatDateTime(report.created_at, locale)} · ${report.engine?.name ?? 'oasdiff'} ${report.engine?.version ?? report.engine_version}`}
        />
      </dl>

      {/* Recuento por impacto: cada tarjeta filtra la lista */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SEVERITY_ORDER.map((s) => {
          const count = report.summary?.[s] ?? 0
          const active = severities.has(s)
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => toggleSeverity(s)}
              className={cn(
                'rounded-2xl border p-3.5 text-left transition',
                TONE_CLASSES[SEVERITY_TONE[s]],
                active ? 'ring-2 ring-ase-primary/70' : 'opacity-90 hover:opacity-100',
                count === 0 && !active && 'opacity-55',
              )}
            >
              <div className="text-2xl font-extrabold tabular-nums">{count}</div>
              <div className="mt-0.5 text-xs font-semibold">{tt(`severity.${s}`)}</div>
              <div className="mt-1 text-[11px] opacity-80">{tt(`severityHint.${s}`)}</div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-ase-muted">{tt('compare.totalNote', { total: report.summary?.total ?? findings.length })}</p>

      {/* Filtros */}
      {findings.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tt('compare.searchPlaceholder')}
              aria-label={tt('compare.searchPlaceholder')}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('compare.categories')}>
              <CategoryChip active={category === null} onClick={() => setCategory(null)}>
                {tt('compare.allCategories')}
              </CategoryChip>
              {categories.map(([c, n]) => (
                <CategoryChip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
                  {has(`category.${c}`) ? tt(`category.${c}`) : c} · {n}
                </CategoryChip>
              ))}
            </div>
            {filtering ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeverities(new Set())
                  setCategory(null)
                  setQuery('')
                }}
              >
                {tt('compare.clearFilters')}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-ase-muted" aria-live="polite">
            {tt('compare.showing', { shown: visible.length, total: findings.length })}
          </p>
        </div>
      ) : null}

      {/* Hallazgos */}
      {findings.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-ase-text2">
          {tt('compare.noFindings')}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-ase-text2">
          {tt('compare.noMatches')}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</dt>
      <dd className="mt-1 break-words text-ase-text">{value}</dd>
    </div>
  )
}

function ContractChip({ label, sub }: { label?: string; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
      <span className="font-semibold">{label ?? '—'}</span>
      {sub ? <span className="text-[11px] text-ase-muted">OpenAPI {sub}</span> : null}
    </span>
  )
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-semibold transition',
        active
          ? 'border-ase-primary/60 bg-ase-primary/15 text-ase-text'
          : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}

function FindingCard({ finding: f }: { finding: CgComparisonReport['findings'][number] }) {
  const { tt, has } = useCgT()
  const tone = SEVERITY_TONE[f.severity as CgSeverity]
  const hasValues = f.previous_value !== null && f.previous_value !== undefined || f.current_value !== null && f.current_value !== undefined
  return (
    <li className={cn('rounded-2xl border bg-white/[0.02] p-4', tone ? TONE_CLASSES[tone].split(' ')[0] : 'border-white/10')}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={tone ?? 'default'}>{has(`severity.${f.severity}`) ? tt(`severity.${f.severity}`) : f.severity}</Badge>
        <Badge>{has(`category.${f.category}`) ? tt(`category.${f.category}`) : f.category}</Badge>
        <code className="break-all text-xs text-ase-muted">{f.rule_id}</code>
      </div>
      <p className="mt-2 break-all font-mono text-sm font-semibold text-ase-text">{f.location}</p>
      <p className="mt-1 text-sm text-ase-text2">{f.description}</p>
      {hasValues ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ValueBox label={tt('compare.before')} value={f.previous_value} />
          <ValueBox label={tt('compare.after')} value={f.current_value} />
        </div>
      ) : null}
      {f.recommendation ? (
        <div className="mt-3 flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-ase-text2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} aria-hidden="true" />
          <span>
            <span className="font-semibold text-ase-text">{tt('compare.recommendation')}: </span>
            {f.recommendation}
          </span>
        </div>
      ) : null}
    </li>
  )
}

function ValueBox({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <pre className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs text-ase-text2 whitespace-pre-wrap break-words">
        {formatValue(value)}
      </pre>
    </div>
  )
}
