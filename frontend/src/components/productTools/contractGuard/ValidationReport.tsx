import { CheckCircle2, XCircle } from 'lucide-react'
import type { CgValidationReport } from '../../../api/contractGuard.api'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'
import { TONE_CLASSES } from './contractGuard.utils'
import { useCgT } from './useCgT'

/** Resultado de validar una respuesta. `valid:false` es un resultado normal
 * (HTTP 200), no un error de la petición: se presenta como veredicto, y el
 * detalle de cada incumplimiento va debajo. */
export function ValidationReport({ report }: { report: CgValidationReport }) {
  const { tt, has } = useCgT()
  const tone = report.valid ? 'success' : 'error'
  const Icon = report.valid ? CheckCircle2 : XCircle
  const presenceOnly = report.validation_scope === 'body_presence_only'
  const sel = report.selection

  return (
    <section aria-label={tt('validate.reportTitle')} className="space-y-4">
      <div className={cn('flex flex-wrap items-start gap-4 rounded-2xl border p-4 sm:p-5', TONE_CLASSES[tone])}>
        <Icon className="h-9 w-9 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold" role="status">
            {report.valid ? tt('validate.valid') : tt('validate.invalid')}
          </h3>
          <p className="mt-1 text-sm opacity-90">
            {report.valid ? tt('validate.validHint') : tt('validate.invalidHint', { count: report.error_count })}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {presenceOnly ? tt('validate.scopePresence') : tt('validate.scopeBody')}
          </p>
        </div>
      </div>

      {/* Qué se evaluó (solo con contrato guardado) */}
      {sel ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Cell label={tt('validate.operation')} value={`${sel.method} ${sel.path_template}`} mono />
          <Cell label={tt('validate.requestedPath')} value={sel.requested_path} mono />
          <Cell label={tt('validate.status')} value={`${sel.status_code} (${sel.response_key})`} />
          <Cell label={tt('validate.mediaType')} value={sel.media_type_key ?? sel.content_type} mono />
          {sel.schema_ref ? <Cell label={tt('validate.schemaRef')} value={sel.schema_ref} mono /> : null}
          {report.version_label ? <Cell label={tt('validate.contract')} value={report.version_label} /> : null}
        </dl>
      ) : null}

      {/* Incumplimientos */}
      {report.errors.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-ase-muted">
              <tr>
                <th scope="col" className="px-3 py-2">{tt('validate.colPath')}</th>
                <th scope="col" className="px-3 py-2">{tt('validate.colRule')}</th>
                <th scope="col" className="px-3 py-2">{tt('validate.colConstraint')}</th>
                <th scope="col" className="px-3 py-2">{tt('validate.colMessage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {report.errors.map((e, i) => (
                <tr key={`${e.path}|${e.schema_path}|${i}`} className="align-top">
                  <td className="px-3 py-2 font-mono text-xs text-ase-text">{e.path === '' ? tt('validate.root') : e.path}</td>
                  <td className="px-3 py-2">
                    <Badge variant="error">{e.rule}</Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-ase-muted break-all">{e.schema_path}</td>
                  <td className="px-3 py-2 text-ase-text2">{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {report.truncated ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {tt('validate.truncated', { count: report.error_count })}
        </p>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{tt('validate.warnings')}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ase-text2">
            {report.warnings.map((w) => (
              <li key={w}>{has(`warning.${w}`) ? tt(`warning.${w}`) : w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.validator ? (
        <p className="text-xs text-ase-muted">
          {tt('validate.validatorLine', {
            name: report.validator.name,
            version: report.validator.version,
            dialect: report.validator.dialect,
          })}
        </p>
      ) : null}
    </section>
  )
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</dt>
      <dd className={cn('mt-1 break-all text-ase-text', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}
