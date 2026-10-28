import type { Npc, World } from '../../engine/types'
import { kobaltoWorldEn } from './kobalto.en'

/**
 * Kobalto in the “SQL from scratch” course (English): the same neobank seen
 * from its data. Adds Inés, the data engineer who mentors the course.
 */
const NEW_NPCS: Npc[] = [{ id: 'ines', name: 'Inés Moreno', role: 'Data Engineer · your mentor', avatar: 'IM', color: '#22D3EE' }]

export function kobaltoDataWorldEn(roles: Record<string, string> = {}): World {
  const npcs = [...kobaltoWorldEn.npcs, ...NEW_NPCS].map((n) => (roles[n.id] ? { ...n, role: roles[n.id] } : n))
  return { ...kobaltoWorldEn, npcs }
}
