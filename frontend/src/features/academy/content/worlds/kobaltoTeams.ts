import type { Npc, World } from '../../engine/types'
import { kobaltoWorld } from './kobalto'

/**
 * Kobalto en el curso «Gestión de equipos QA»: el mismo neobanco, con los
 * personajes nuevos de la carrera del jugador (ver
 * docs/academy/gestion-equipos-qa/PLAN.md §2).
 *
 * Los cargos cambian con los años (Laura pasa de QA Lead a VP, Sergio acaba
 * reportando al jugador…), así que cada misión pide el mundo con los cargos
 * de su momento.
 */
const NEW_NPCS: Npc[] = [
  { id: 'lucia', name: 'Lucía Campos', role: 'QA junior', avatar: 'LC', color: '#FB7185' },
  { id: 'hector', name: 'Héctor Bravo', role: 'QA · Pagos', avatar: 'HB', color: '#34D399' },
  { id: 'andrea', name: 'Andrea Gil', role: 'People Partner · Personas', avatar: 'AG', color: '#C084FC' },
  { id: 'irene', name: 'Irene Sáez', role: 'CEO', avatar: 'IS', color: '#FBBF24' },
  { id: 'nerea', name: 'Nerea Ortiz', role: 'QA · Pagos', avatar: 'NO', color: '#2DD4BF' },
  { id: 'pablo', name: 'Pablo Ríos', role: 'QA · Tarjetas', avatar: 'PR', color: '#FB923C' },
  { id: 'olga', name: 'Olga Vera', role: 'Ventas · Sandbloq (proveedor)', avatar: 'OV', color: '#F43F5E' },
  // El propio jugador, para comentarios que deja en tickets o documentos.
  { id: 'yo', name: 'Tú', role: 'Tu comentario', avatar: 'TÚ', color: '#0EA5E9' },
]

export function kobaltoTeamsWorld(roles: Record<string, string> = {}): World {
  const npcs = [...kobaltoWorld.npcs, ...NEW_NPCS].map((n) => (roles[n.id] ? { ...n, role: roles[n.id] } : n))
  return { ...kobaltoWorld, npcs }
}
