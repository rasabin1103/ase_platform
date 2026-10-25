import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { getContractGuardStatus, listCgProjects } from '../../../api/contractGuard.api'
import { EmptyState } from '../../ui/EmptyState'
import { Skeleton } from '../../ui/Skeleton'
import { cn } from '../../ui/cn'
import { CgErrorNote } from './CgErrorNote'
import { ComparePanel } from './ComparePanel'
import { ContractsPanel } from './ContractsPanel'
import { ProjectsPanel } from './ProjectsPanel'
import { useCgT } from './useCgT'
import { ValidatePanel } from './ValidatePanel'

type Tab = 'contracts' | 'compare' | 'validate'

/** Pantalla propia de ASE API Contract Guard dentro de «Probar mis productos»:
 * proyectos y versiones de contrato, comparación con informe por impacto y
 * validación de respuestas. Sustituye al visor genérico de ejecuciones, que
 * aquí no aplica (no hay workflow, cuota ni historial de runs). */
export default function ContractGuardWorkbench() {
  const { tt } = useCgT()
  const [tab, setTab] = useState<Tab>('contracts')
  const [projectId, setProjectId] = useState<string | null>(null)

  const statusQuery = useQuery({ queryKey: ['cg-status'], queryFn: getContractGuardStatus, staleTime: 30_000 })
  const available = statusQuery.data?.available === true
  const projectsQuery = useQuery({ queryKey: ['cg-projects'], queryFn: listCgProjects, enabled: available })

  if (statusQuery.isLoading) return <Skeleton className="h-48 rounded-2xl" />
  if (statusQuery.isError) return <CgErrorNote error={statusQuery.error} fallbackKey="errors.load" />
  if (!statusQuery.data?.configured) {
    return <EmptyState title={tt('status.notConfigured')} description={tt('status.notConfiguredHint')} />
  }
  if (!available) {
    return (
      <div role="alert" className="flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <div className="font-semibold">{tt('status.unavailable')}</div>
          <p className="mt-1 opacity-90">{tt('status.unavailableHint')}</p>
        </div>
      </div>
    )
  }

  const projects = projectsQuery.data ?? []
  // Si el proyecto seleccionado desaparece (borrado fuera de ASE) se descarta.
  const activeId = projects.some((p) => p.id === projectId) ? projectId : null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'contracts', label: tt('tabs.contracts') },
    { key: 'compare', label: tt('tabs.compare') },
    { key: 'validate', label: tt('tabs.validate') },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-ase-text2">{tt('intro')}</p>

      {projectsQuery.isError ? (
        <CgErrorNote error={projectsQuery.error} fallbackKey="errors.load" />
      ) : (
        <ProjectsPanel
          projects={projects}
          selectedId={activeId}
          maxProjects={statusQuery.data.maxProjects}
          onSelect={setProjectId}
        />
      )}

      <div role="tablist" aria-label={tt('tabs.label')} className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            role="tab"
            id={`cg-tab-${tb.key}`}
            aria-selected={tab === tb.key}
            aria-controls={`cg-panel-${tb.key}`}
            onClick={() => setTab(tb.key)}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm font-semibold transition',
              tab === tb.key
                ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-brand'
                : 'border-white/10 bg-ase-surface text-ase-text2 hover:border-white/20',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`cg-panel-${tab}`} aria-labelledby={`cg-tab-${tab}`}>
        {tab === 'validate' ? (
          <ValidatePanel key={activeId ?? 'none'} projectId={activeId} />
        ) : activeId ? (
          tab === 'contracts' ? (
            <ContractsPanel key={activeId} projectId={activeId} />
          ) : (
            <ComparePanel key={activeId} projectId={activeId} />
          )
        ) : (
          <EmptyState
            title={projects.length === 0 ? tt('projects.emptyTitle') : tt('projects.pickTitle')}
            description={projects.length === 0 ? tt('projects.emptyHint') : tt('projects.pickHint')}
          />
        )}
      </div>
    </div>
  )
}
