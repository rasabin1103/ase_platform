import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, History } from 'lucide-react'
import { useState } from 'react'
import {
  createCgComparison,
  downloadCgComparison,
  getCgComparison,
  listCgComparisons,
  listCgContracts,
  type CgComparisonReport,
} from '../../../api/contractGuard.api'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Select } from '../../ui/Select'
import { Skeleton } from '../../ui/Skeleton'
import { CgErrorNote } from './CgErrorNote'
import { ComparisonReport } from './ComparisonReport'
import { OVERALL_TONE, formatDateTime } from './contractGuard.utils'
import { useCgT } from './useCgT'

/** Comparar dos versiones de un proyecto (referencia → candidata) y ver el
 * historial. La comparación es síncrona: el POST devuelve el informe final.
 * La dirección importa: invertirla puede cambiar el resultado. */
export function ComparePanel({ projectId }: { projectId: string }) {
  const { tt, has, locale } = useCgT()
  const qc = useQueryClient()
  const [baselineId, setBaselineId] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [fresh, setFresh] = useState<CgComparisonReport | null>(null)

  const contractsQuery = useQuery({
    queryKey: ['cg-contracts', projectId],
    queryFn: () => listCgContracts(projectId, { limit: 200 }),
  })
  const historyQuery = useQuery({
    queryKey: ['cg-comparisons', projectId],
    queryFn: () => listCgComparisons(projectId, { limit: 50 }),
  })
  const openedQuery = useQuery({
    queryKey: ['cg-comparison', openedId],
    queryFn: () => getCgComparison(openedId!),
    enabled: openedId !== null && fresh?.id !== openedId,
  })

  const runMut = useMutation({
    mutationFn: () => createCgComparison(projectId, { baselineId, candidateId }),
    onSuccess: async (report) => {
      setFresh(report)
      setOpenedId(report.id)
      await qc.invalidateQueries({ queryKey: ['cg-comparisons', projectId] })
    },
  })
  const exportMut = useMutation({ mutationFn: (id: string) => downloadCgComparison(id) })

  const contracts = contractsQuery.data ?? []
  const labelOf = (id: string) => contracts.find((c) => c.id === id)?.version_label ?? id.slice(0, 8)
  const report = fresh && fresh.id === openedId ? fresh : openedQuery.data ?? null

  if (contractsQuery.isLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (contracts.length < 2) {
    return <EmptyState title={tt('compare.needTwo')} description={tt('compare.needTwoHint')} />
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          if (baselineId && candidateId) runMut.mutate()
        }}
      >
        <div>
          <label htmlFor="cg-baseline" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('compare.baseline')}
          </label>
          <Select id="cg-baseline" value={baselineId} onChange={(e) => setBaselineId(e.target.value)}>
            <option value="">{tt('compare.choose')}</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.version_label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[11px] text-ase-muted">{tt('compare.baselineHint')}</p>
        </div>
        <div>
          <label htmlFor="cg-candidate" className="mb-1 block text-xs font-medium text-ase-muted">
            {tt('compare.candidate')}
          </label>
          <Select id="cg-candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
            <option value="">{tt('compare.choose')}</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.version_label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[11px] text-ase-muted">{tt('compare.candidateHint')}</p>
        </div>
        <Button
          type="submit"
          disabled={!baselineId || !candidateId || runMut.isPending}
          leftIcon={<ArrowRightLeft className="h-4 w-4" strokeWidth={1.75} />}
        >
          {runMut.isPending ? tt('compare.running') : tt('compare.run')}
        </Button>
        {baselineId && candidateId && baselineId === candidateId ? (
          <p className="text-xs text-ase-muted md:col-span-3">{tt('compare.sameVersion')}</p>
        ) : null}
        {runMut.isError ? (
          <div className="md:col-span-3">
            <CgErrorNote error={runMut.error} />
          </div>
        ) : null}
      </form>

      {runMut.isPending ? <Skeleton className="h-56 rounded-2xl" /> : null}
      {openedId && !runMut.isPending ? (
        openedQuery.isLoading && !report ? (
          <Skeleton className="h-56 rounded-2xl" />
        ) : openedQuery.isError && !report ? (
          <CgErrorNote error={openedQuery.error} fallbackKey="errors.load" />
        ) : report ? (
          <ComparisonReport
            key={report.id}
            report={report}
            exporting={exportMut.isPending}
            onExport={() => exportMut.mutate(report.id)}
          />
        ) : null
      ) : null}
      {exportMut.isError ? <CgErrorNote error={exportMut.error} /> : null}

      {/* Historial */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ase-text">
          <History className="h-4 w-4 text-ase-muted" strokeWidth={1.75} aria-hidden="true" />
          {tt('compare.history')}
        </h3>
        {historyQuery.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : historyQuery.isError ? (
          <CgErrorNote error={historyQuery.error} fallbackKey="errors.load" />
        ) : (historyQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-ase-muted">{tt('compare.historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {(historyQuery.data ?? []).map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  aria-current={run.id === openedId ? 'true' : undefined}
                  onClick={() => setOpenedId(run.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition hover:bg-white/[0.04] aria-[current=true]:bg-white/[0.06]"
                >
                  <Badge variant={OVERALL_TONE[run.overall_result] ?? 'default'}>
                    {has(`result.${run.overall_result}`) ? tt(`result.${run.overall_result}`) : run.overall_result}
                  </Badge>
                  <span className="font-medium text-ase-text">
                    {labelOf(run.baseline_id)} → {labelOf(run.candidate_id)}
                  </span>
                  <span className="text-xs text-ase-muted">
                    {tt('compare.historyCounts', {
                      breaking: run.summary.breaking,
                      review: run.summary.potentially_breaking,
                      total: run.summary.total,
                    })}
                  </span>
                  <span className="ml-auto text-xs text-ase-muted">{formatDateTime(run.created_at, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
