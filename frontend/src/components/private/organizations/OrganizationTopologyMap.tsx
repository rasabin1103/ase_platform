import type { Organization } from '../../../types/organization.types'
import { cn } from '../../ui/cn'

type Props = {
  organizations: Organization[]
  coreLabel: string
  activeUuid: string | null
  typeLabel: (type: string) => string
  legend: {
    active: string
    selected: string
    suspended: string
  }
}

const positions = [
  'left-[8%] top-[18%]',
  'left-[68%] top-[12%]',
  'left-[76%] top-[58%]',
  'left-[16%] top-[66%]',
  'left-[46%] top-[8%]',
  'left-[50%] top-[76%]',
]

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? 'O') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function statusClasses(org: Organization, activeUuid: string | null) {
  if (org.uuid === activeUuid) return 'border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.26)]'
  if (org.status === 'suspended') return 'border-amber-300/50 bg-amber-400/12 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.18)]'
  return 'border-emerald-300/45 bg-emerald-400/12 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.18)]'
}

export function OrganizationTopologyMap({ organizations, coreLabel, activeUuid, typeLabel, legend }: Props) {
  const visibleOrgs = organizations.slice(0, positions.length)

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {visibleOrgs.map((org, index) => {
          const coords = [
            [18, 28],
            [76, 22],
            [84, 70],
            [24, 76],
            [54, 18],
            [58, 84],
          ][index]
          return (
            <line
              key={org.uuid}
              x1="50"
              y1="50"
              x2={coords[0]}
              y2={coords[1]}
              stroke={org.status === 'suspended' ? 'rgba(245,158,11,0.34)' : 'rgba(34,211,238,0.32)'}
              strokeWidth="0.35"
              strokeDasharray={org.status === 'suspended' ? '2 2' : undefined}
            />
          )
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-[2] w-40 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-cyan-200/30 bg-ase-bg2/80 p-4 text-center shadow-[0_0_44px_rgba(34,211,238,0.22)] backdrop-blur-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-lg font-bold text-cyan-100 ring-1 ring-cyan-200/25">
          ASE
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">{coreLabel}</div>
      </div>

      {visibleOrgs.map((org, index) => (
        <div key={org.uuid} className={cn('absolute z-[3] w-[150px]', positions[index])}>
          <div className={cn('rounded-2xl border p-3 backdrop-blur-md transition duration-200 hover:-translate-y-1', statusClasses(org, activeUuid))}>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold ring-1 ring-white/15">
                {initials(org.name)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{org.name}</div>
                <div className="truncate text-[10px] uppercase tracking-wide opacity-70">{typeLabel(org.type)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 text-[11px] text-ase-text2">
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1">{legend.active}</span>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1">{legend.selected}</span>
        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1">{legend.suspended}</span>
      </div>
    </div>
  )
}
