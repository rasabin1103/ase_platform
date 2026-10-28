import type { Npc, World } from '../../engine/types'
import { kobaltoWorldEn } from './kobalto.en'

/**
 * Kobalto in the “QA Team Management” course (English): the same neobank with
 * the new characters of the player's career (see kobaltoTeams.ts).
 */
const NEW_NPCS: Npc[] = [
  { id: 'lucia', name: 'Lucía Campos', role: 'Junior QA', avatar: 'LC', color: '#FB7185' },
  { id: 'hector', name: 'Héctor Bravo', role: 'QA · Payments', avatar: 'HB', color: '#34D399' },
  { id: 'andrea', name: 'Andrea Gil', role: 'People Partner · People', avatar: 'AG', color: '#C084FC' },
  { id: 'irene', name: 'Irene Sáez', role: 'CEO', avatar: 'IS', color: '#FBBF24' },
  { id: 'nerea', name: 'Nerea Ortiz', role: 'QA · Payments', avatar: 'NO', color: '#2DD4BF' },
  { id: 'pablo', name: 'Pablo Ríos', role: 'QA · Cards', avatar: 'PR', color: '#FB923C' },
  { id: 'olga', name: 'Olga Vera', role: 'Sales · Sandbloq (vendor)', avatar: 'OV', color: '#F43F5E' },
  // The player, for comments left on tickets or documents.
  { id: 'yo', name: 'You', role: 'Your comment', avatar: 'TÚ', color: '#0EA5E9' },
]

export function kobaltoTeamsWorldEn(roles: Record<string, string> = {}): World {
  const npcs = [...kobaltoWorldEn.npcs, ...NEW_NPCS].map((n) => (roles[n.id] ? { ...n, role: roles[n.id] } : n))
  return { ...kobaltoWorldEn, npcs }
}
