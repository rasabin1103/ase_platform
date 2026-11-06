import type { Mission } from '../../../engine/types'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'

/** Papeles del reparto en el curso «SQL para QA» (cuarto mes en Kobalto, ahora en el equipo de QA). */
export const ROLES = {
  marta: 'Product Owner · Pagos',
  diego: 'Backend developer · Transferencias',
  nuria: 'Atención al cliente',
  ines: 'Responsable de Datos',
  laura: 'QA Lead · tu mentora',
}

/** Lo que comparten todas las misiones del curso (consola SQL, Laura de mentora, jornada de 8 horas). */
export const COMUN = {
  courseKey: 'sql-qa',
  world: kobaltoDataWorld(ROLES),
  playerRole: 'QA · Kobalto',
  dayStart: 9 * 60,
  duration: 480,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'QA',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  hideBugList: true,
  wikiLabel: 'Wiki · QA',
  initialMetrics: {},
  mentor: 'laura',
  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],
  endSceneId: 'closing',
  tickets: [],
} satisfies Partial<Mission>

/** Encargo que exige una construcción concreta en la consulta. */
export const exige = (pattern: RegExp, message: string) => ({ pattern, message })
