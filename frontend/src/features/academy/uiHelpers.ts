import type { Mission, Npc, ScoreKey, Severity } from './engine/types'

export const SCORE_LABEL: Record<ScoreKey, string> = {
  rigor: 'Rigor técnico',
  communication: 'Comunicación',
  risk: 'Gestión del riesgo',
  efficiency: 'Gestión del tiempo',
}

export const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-ase-error/15 text-ase-error border-ase-error/40',
  high: 'bg-ase-warning/15 text-ase-warning border-ase-warning/40',
  medium: 'bg-ase-brand/15 text-ase-brand border-ase-brand/40',
  low: 'bg-white/5 text-ase-muted border-ase-border',
}

export function npcOf(mission: Mission, id: string): Npc {
  return (
    mission.world.npcs.find((n) => n.id === id) ?? { id, name: id, role: '', avatar: '?', color: '#94A3B8' }
  )
}
