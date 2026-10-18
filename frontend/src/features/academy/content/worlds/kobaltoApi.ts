import type { World } from '../../engine/types'
import { kobaltoWorld } from './kobalto'

/**
 * Kobalto, squad de Open API (curso de Karate). Mismo mundo que los otros
 * cursos, con los personajes del squad que abre la API a partners.
 */
export const kobaltoApiWorld: World = {
  ...kobaltoWorld,
  npcs: [
    ...kobaltoWorld.npcs.map((n) => (n.id === 'sergio' ? { ...n, role: 'QA Automation Lead · tu mentor' } : n)),
    { id: 'alba', name: 'Alba Quintero', role: 'Product Owner · Open API', avatar: 'AQ', color: '#FB7185' },
    { id: 'nico', name: 'Nicolás Prado', role: 'Backend developer · Open API', avatar: 'NP', color: '#34D399' },
    { id: 'iker', name: 'Iker Medina', role: 'QA Automation (junior) · Open API', avatar: 'IM', color: '#FBBF24' },
  ],
}
