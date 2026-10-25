import type { AppEvent } from '../../engine/types'

/**
 * App «Revisión» del curso 4, misión 3 (El junior): el primer pull request de
 * tests de Lucía. Por cada bloque se elige qué comentario dejar (o ninguno).
 * Se evalúa si se detectan los problemas reales, si se distinguen de las
 * preferencias de estilo, si se reconoce lo bien hecho y el tono.
 */

export type CommentKind = 'none' | 'helpful' | 'nit' | 'praise' | 'harsh' | 'rewrite'

export interface Hunk {
  id: string
  /** Líneas de código del bloque. */
  code: string
  kind: 'issue' | 'style' | 'good'
  /** Qué hay en el bloque (se muestra tras enviar la revisión). */
  explanation: string
  /** Cómo quedaría un comentario útil en este bloque. */
  helpful?: string
}

export const PR = {
  id: 'PR #482',
  title: 'Tests de extractos mensuales (KOB-512)',
  author: 'lucia',
  description: 'Primer PR de Lucía: tests automáticos de la API de extractos mensuales.',
}

export const HUNKS: Hunk[] = [
  {
    id: 'h1',
    code: "Scenario: extracto de un mes con movimientos\n  Given path 'statements', 'ACC-1001', '2026-03'\n  When method get\n  Then status 200",
    kind: 'issue',
    explanation: 'Solo comprueba el código 200. Un extracto vacío o con importes mal calculados también pasaría: hay que comprobar el contenido (número de movimientos, saldo final).',
    helpful: '«Con solo el 200, un extracto vacío también pasaría. ¿Comprobamos el número de movimientos y el saldo final? Algo así: And match response.movements == \'#[3]\'»',
  },
  {
    id: 'h2',
    code: "Background:\n  * def account = 'ACC-1001'",
    kind: 'issue',
    explanation: 'Usa una cuenta de prueba compartida con otros tests: si otro la modifica, este falla (lo que vimos en la suite el año pasado). Cada test debería crear su cuenta.',
    helpful: '«ACC-1001 la usan otros tests y a veces la modifican: el tuyo fallaría sin motivo. Mira createAccount() en utils: crea una cuenta solo para este test.»',
  },
  {
    id: 'h3',
    code: "  * karate.sleep(3000)\n  Given path 'statements', account, '2026-03', 'pdf'",
    kind: 'issue',
    explanation: 'Espera fija de 3 segundos: lenta cuando sobra y frágil cuando falta. Mejor reintentar hasta que el PDF esté listo (retry until).',
    helpful: '«Las esperas fijas fallan cuando staging va lento y sobran cuando va rápido. Prueba con retry until responseStatus == 200: espera lo justo.»',
  },
  {
    id: 'h4',
    code: '  * def x = response',
    kind: 'style',
    explanation: 'Un nombre poco descriptivo. Es una preferencia: como mucho, un «nit» opcional.',
  },
  {
    id: 'h5',
    code: 'Scenario: statement of a month without movements',
    kind: 'style',
    explanation: 'Mezcla inglés y español en los nombres de los escenarios. Convención de estilo, no un problema: «nit» opcional o nada.',
  },
  {
    id: 'h6',
    code: "Scenario: un mes que no existe devuelve 404\n  Given path 'statements', account, '2026-13'\n  When method get\n  Then status 404\n  And match response.code == 'MONTH_NOT_FOUND'",
    kind: 'good',
    explanation: 'Buen caso negativo, con el código de error comprobado. Merece que se lo digas.',
  },
]

export const COMMENT_LABEL: Record<CommentKind, string> = {
  none: 'Sin comentario',
  helpful: 'Bloqueante: el porqué y una sugerencia',
  nit: '«Nit (opcional):» tu preferencia',
  praise: 'Reconocer lo que está bien hecho',
  harsh: '«Esto está mal.»',
  rewrite: 'Lo arreglo yo directamente en su rama',
}

/** Comentario que se envía en el PR con cada opción (para el bloque h1 como ejemplo de tono). */
export const COMMENT_EXAMPLE: Record<CommentKind, string> = {
  none: '',
  helpful: '«El porqué del problema y una sugerencia concreta.»',
  nit: '«Nit (opcional): es una preferencia mía; cámbialo solo si te convence.»',
  praise: '«¡Esto está muy bien hecho!» (y por qué)',
  harsh: '«Esto está mal.»',
  rewrite: '(Haces tú el cambio en su rama, sin comentario.)',
}

export interface PrState {
  comments: Record<string, CommentKind>
  submitted: boolean
}

export const INITIAL_PR: PrState = { comments: {}, submitted: false }

const APP = 'kobalto-pr'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `pr.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function setComment(state: PrState, hunkId: string, kind: CommentKind): { state: PrState; event: AppEvent } {
  if (state.submitted || !HUNKS.some((h) => h.id === hunkId)) return { state, event: event('noop', 'Sin cambios.', 0) }
  return { state: { ...state, comments: { ...state.comments, [hunkId]: kind } }, event: event('comment', `${hunkId}: ${COMMENT_LABEL[kind]}.`, 0) }
}

export function evaluateReview(comments: Record<string, CommentKind>) {
  const get = (id: string) => comments[id] ?? 'none'
  const issues = HUNKS.filter((h) => h.kind === 'issue')
  const styles = HUNKS.filter((h) => h.kind === 'style')
  const goods = HUNKS.filter((h) => h.kind === 'good')
  const all = HUNKS.map((h) => get(h.id))
  return {
    issuesHelpful: issues.filter((h) => get(h.id) === 'helpful').length,
    issuesTotal: issues.length,
    /** El problema que deja pasar bugs (h1) se señala de alguna forma. */
    caught: ['helpful', 'harsh', 'rewrite'].includes(get('h1')),
    harsh: all.includes('harsh'),
    rewrite: all.includes('rewrite'),
    /** Preferencias de estilo tratadas como bloqueantes. */
    nitpicky: styles.some((h) => ['helpful', 'harsh', 'rewrite'].includes(get(h.id))),
    praised: goods.every((h) => get(h.id) === 'praise'),
  }
}

export function submitReview(state: PrState): { state: PrState; event: AppEvent } {
  if (state.submitted) return { state, event: event('noop', 'Revisión ya enviada.', 0) }
  const r = evaluateReview(state.comments)
  const flags = ['review.submitted']
  if (r.caught) flags.push('review.caught')
  if (!r.harsh && !r.rewrite) flags.push('review.kind')
  if (r.harsh) flags.push('review.harsh')
  if (r.rewrite) flags.push('review.took_over')
  if (r.nitpicky) flags.push('review.nitpicky')
  if (r.issuesHelpful === r.issuesTotal && !r.harsh && !r.rewrite && !r.nitpicky && r.praised) flags.push('review.ok')
  return {
    state: { ...state, submitted: true },
    event: event('submit', `Revisión enviada: ${r.issuesHelpful} de ${r.issuesTotal} problemas reales comentados con el porqué.`, 20, flags),
  }
}
