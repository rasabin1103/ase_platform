import type { Mission } from '../../../engine/types'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'

/** Papeles del reparto en el curso «SQL avanzado» (tercer mes en Kobalto). */
export const ROLES = {
  marta: 'Product Owner · Pagos',
  diego: 'Backend developer · Transferencias',
  nuria: 'Atención al cliente',
  laura: 'QA Lead',
  ines: 'Responsable de Datos · tu mentora',
}

/** Lo que comparten todas las misiones del curso (consola SQL, Inés de mentora, jornada de 8 horas). */
export const COMUN = {
  courseKey: 'sql-avanzado',
  world: kobaltoDataWorld(ROLES),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  duration: 480,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'ines',
  ticketPrefix: 'DAT',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  hideBugList: true,
  wikiLabel: 'Wiki · Datos',
  initialMetrics: {},
  mentor: 'ines',
  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],
  endSceneId: 'closing',
  tickets: [],
} satisfies Partial<Mission>

/** Encargo que exige una construcción concreta en la consulta. */
export const exige = (pattern: RegExp, message: string) => ({ pattern, message })
