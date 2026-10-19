import type { World } from '../../engine/types'
import { kobaltoWorldEn } from './kobalto.en'

/**
 * Kobalto, Open API squad (Karate course). English version of ./kobaltoApi.ts
 * (same npc ids).
 */
export const kobaltoApiWorldEn: World = {
  ...kobaltoWorldEn,
  npcs: [
    ...kobaltoWorldEn.npcs.map((n) => (n.id === 'sergio' ? { ...n, role: 'QA Automation Lead · your mentor' } : n)),
    { id: 'alba', name: 'Alba Quintero', role: 'Product Owner · Open API', avatar: 'AQ', color: '#FB7185' },
    { id: 'nico', name: 'Nicolás Prado', role: 'Backend developer · Open API', avatar: 'NP', color: '#34D399' },
    { id: 'iker', name: 'Iker Medina', role: 'QA Automation (junior) · Open API', avatar: 'IM', color: '#FBBF24' },
  ],
}
