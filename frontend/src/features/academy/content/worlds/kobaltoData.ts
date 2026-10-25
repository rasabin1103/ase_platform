import type { Npc, World } from '../../engine/types'
import { kobaltoWorld } from './kobalto'

/**
 * Kobalto en el curso «SQL desde cero»: el mismo neobanco visto desde sus
 * datos. Añade a Inés, la data engineer que hace de mentora del curso
 * (ver docs/academy/sql-iniciacion/PLAN.md §2).
 */
const NEW_NPCS: Npc[] = [{ id: 'ines', name: 'Inés Moreno', role: 'Data Engineer · tu mentora', avatar: 'IM', color: '#22D3EE' }]

export function kobaltoDataWorld(roles: Record<string, string> = {}): World {
  const npcs = [...kobaltoWorld.npcs, ...NEW_NPCS].map((n) => (roles[n.id] ? { ...n, role: roles[n.id] } : n))
  return { ...kobaltoWorld, npcs }
}
