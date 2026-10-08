import type {
  Action,
  BugReport,
  BugReportInput,
  Condition,
  Effect,
  Mission,
  Priority,
  ReportStatus,
  RunState,
  Scene,
  ScoreKey,
  Severity,
  ToolId,
} from './types'
import { designCoverage, designRigorBonus, reviewMessage, type DesignCoverage } from './design'
import { riskAssessment, riskFeedback } from './risk'
import { ISSUE_LABEL } from './review'

/**
 * Motor determinista: `step(mission, state, action)` es una función pura.
 * Con la misma semilla y la misma lista de acciones siempre se obtiene la
 * misma partida, lo que permite guardar solo {seed, actions} y reproducir.
 */

// ------------------------------------------------------------------ RNG
/** mulberry32: PRNG pequeño y determinista. Devuelve [valor 0–1, nuevo estado]. */
export function nextRandom(rngState: number): [number, number] {
  const next = (rngState + 0x6d2b79f5) | 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

// ---------------------------------------------------------------- Helpers
const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

/** Valor de `Message.chosen` para reuniones a las que no se asistió. */
export const PRIORITY_LABEL: Record<Priority, string> = {
  p1: 'P1 · Urgente',
  p2: 'P2 · Alta',
  p3: 'P3 · Media',
  p4: 'P4 · Baja',
}
const PRIORITY_ORDER: Priority[] = ['p1', 'p2', 'p3', 'p4']

/** Texto en minúsculas y sin tildes, para buscar condiciones de reproducción. */
export function normalizeText(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const MISSED = '__missed__'

const REPORTED_STATUSES: ReportStatus[] = ['accepted', 'needs_info', 'resolved', 'verified', 'reopened']

function npcName(mission: Mission, id: string): string {
  return mission.world.npcs.find((n) => n.id === id)?.name.split(' ')[0] ?? id
}

function sceneById(mission: Mission, id: string): Scene {
  const scene = mission.scenes.find((s) => s.id === id)
  if (!scene) throw new Error(`[academy] Escena desconocida: ${id}`)
  return scene
}

function bugSeverity(mission: Mission, bugId: string): Severity | undefined {
  return mission.bugs.find((b) => b.id === bugId)?.severity
}

export function reportedBugIds(state: RunState): string[] {
  return state.reports.filter((r) => r.bugId && REPORTED_STATUSES.includes(r.status)).map((r) => r.bugId as string)
}

// ------------------------------------------------------------- Condiciones
export function evaluate(mission: Mission, state: RunState, cond: Condition | undefined): boolean {
  if (!cond) return true
  switch (cond.kind) {
    case 'flag':
      return !!state.flags[cond.key]
    case 'notFlag':
      return !state.flags[cond.key]
    case 'metricGte':
      return (state.metrics[cond.key] ?? 0) >= cond.value
    case 'metricLt':
      return (state.metrics[cond.key] ?? 0) < cond.value
    case 'bugTriggered':
      return state.triggeredBugs.some(
        (id) => (!cond.bugId || id === cond.bugId) && (!cond.severity || bugSeverity(mission, id) === cond.severity),
      )
    case 'bugReported':
      return reportedBugIds(state).some(
        (id) => (!cond.bugId || id === cond.bugId) && (!cond.severity || bugSeverity(mission, id) === cond.severity),
      )
    case 'bugVerified':
      return state.reports.some(
        (r) =>
          r.status === 'verified' &&
          !!r.bugId &&
          state.fixedBugs.includes(r.bugId) &&
          (!cond.bugId || r.bugId === cond.bugId) &&
          (!cond.severity || bugSeverity(mission, r.bugId) === cond.severity),
      )
    case 'reportsGte':
      return reportedBugIds(state).length >= cond.value
    case 'reportsLt':
      return reportedBugIds(state).length < cond.value
    case 'designCoverageGte':
      return (designCoverage(mission, state)?.ratio ?? 0) >= cond.value
    case 'all':
      return cond.of.every((c) => evaluate(mission, state, c))
    case 'any':
      return cond.of.some((c) => evaluate(mission, state, c))
    case 'not':
      return !evaluate(mission, state, cond.of)
  }
}

// ------------------------------------------------------------- Estado inicial
/** Elige una variante de cada hueco de bugs con la semilla. */
function pickBugs(mission: Mission, rngState: number): [string[], number] {
  if (!mission.bugSlots) return [mission.bugs.filter((b) => !b.regression).map((b) => b.id), rngState]
  let rng = rngState
  const active: string[] = []
  for (const slot of mission.bugSlots) {
    const [roll, next] = nextRandom(rng)
    rng = next
    active.push(slot.options[Math.floor(roll * slot.options.length)])
  }
  return [active, rng]
}

export function createRun(mission: Mission, seed: number): RunState {
  const [activeBugs, rng] = pickBugs(mission, seed | 0)
  return {
    reviewMarks: {},
    reviewResults: {},
    preventedBugs: [],
    quizAnswers: { pre: {}, post: {} },
    lessonsRead: [],
    riskRatings: {},
    riskSubmissions: 0,
    activeBugs,
    missionId: mission.id,
    seed,
    rng,
    clock: 0,
    started: false,
    finished: false,
    flags: {},
    metrics: { ...mission.initialMetrics },
    scores: { rigor: 0, communication: 0, risk: 0, efficiency: 0 },
    messages: [],
    nextMessageId: 1,
    processedScenes: [],
    docsRead: [],
    ticketActionsDone: [],
    log: [],
    nextLogId: 1,
    appState: {},
    triggeredBugs: [],
    reports: [],
    unlocked: [],
    notes: [],
    designCases: [],
    nextCaseId: 1,
    designReviews: 0,
    pendingFixes: [],
    fixedBugs: [],
    activeRegressions: [],
    build: 0,
  }
}

// ------------------------------------------------------------- Mutaciones
// Las funciones internas mutan el borrador `s`; `step` clona antes de llamar.

function deliverScene(mission: Mission, s: RunState, scene: Scene): void {
  if (s.processedScenes.includes(scene.id)) return
  s.processedScenes.push(scene.id)
  s.messages.push({
    id: s.nextMessageId++,
    sceneId: scene.id,
    channel: scene.channel,
    from: scene.from,
    with: scene.with,
    subject: scene.subject,
    body: scene.body,
    at: s.clock,
    read: false,
    replies: [],
  })
  if (scene.onDeliver) applyEffects(mission, s, scene.onDeliver)
}

function pushMessage(s: RunState, from: string, body: string, channel: 'chat' | 'email' = 'chat'): void {
  s.messages.push({ id: s.nextMessageId++, channel, from, body, at: s.clock, read: false, replies: [] })
}

/** Entrega todas las escenas programadas cuyo momento y condición se cumplen. */
function deliverDue(mission: Mission, s: RunState): void {
  if (s.finished) return
  let changed = true
  while (changed) {
    changed = false
    for (const scene of mission.scenes) {
      if (s.processedScenes.includes(scene.id)) continue
      if (scene.at === undefined && !scene.when) continue
      if (scene.at !== undefined && s.clock < scene.at) continue
      if (scene.id === mission.endSceneId && s.clock < mission.duration) continue
      if (!evaluate(mission, s, scene.when)) continue
      if (scene.probability !== undefined) {
        const [roll, rng] = nextRandom(s.rng)
        s.rng = rng
        if (roll >= scene.probability) {
          s.processedScenes.push(scene.id)
          continue
        }
      }
      deliverScene(mission, s, scene)
      changed = true
    }
  }
}

function advance(mission: Mission, s: RunState, minutes: number): void {
  s.clock = Math.max(0, Math.min(mission.duration, s.clock + Math.max(0, minutes)))
  deployFixes(mission, s)
  deliverDue(mission, s)
  if (s.clock >= mission.duration && !s.finished) {
    // Las reuniones que quedaron sin atender se dan por perdidas.
    for (const m of s.messages) {
      if (m.channel === 'meeting' && !m.chosen && m.sceneId !== mission.endSceneId) {
        m.chosen = MISSED
        m.read = true
        s.notes.push({ at: s.clock, tone: 'bad', text: `Te perdiste la reunión «${m.subject ?? ''}».` })
      }
    }
    deliverScene(mission, s, sceneById(mission, mission.endSceneId))
  }
}

function applyEffects(mission: Mission, s: RunState, effects: Effect[]): void {
  for (const e of effects) {
    switch (e.kind) {
      case 'flag':
        s.flags[e.key] = e.value ?? true
        break
      case 'metric':
        s.metrics[e.key] = (s.metrics[e.key] ?? 0) + e.add
        break
      case 'score':
        s.scores[e.key] += e.add
        break
      case 'time':
        advance(mission, s, e.add)
        break
      case 'deliver':
        deliverScene(mission, s, sceneById(mission, e.sceneId))
        break
      case 'unlock':
        if (!s.unlocked.includes(e.conceptId)) s.unlocked.push(e.conceptId)
        break
      case 'note':
        s.notes.push({ at: s.clock, text: e.text, tone: e.tone })
        break
      case 'if':
        applyEffects(mission, s, evaluate(mission, s, e.when) ? e.then : (e.else ?? []))
        break
      case 'endMission':
        s.finished = true
        break
      case 'preventBugs':
        for (const bug of mission.bugs) {
          if (bug.preventedBy && s.flags[bug.preventedBy] && s.activeBugs.includes(bug.id)) {
            s.activeBugs = s.activeBugs.filter((id) => id !== bug.id)
            s.preventedBugs.push(bug.id)
          }
        }
        s.flags['dev.started'] = true
        break
    }
  }
}

// --------------------------------------------------------- Bug reports
export function evaluateReport(
  mission: Mission,
  s: RunState,
  input: BugReportInput,
  /** Report que se está completando (no cuenta como ya reportado). */
  excludeKey?: string,
): Pick<BugReport, 'bugId' | 'status' | 'quality' | 'feedback'> {
  const feedback: string[] = []
  const evidenceBugs = Array.from(
    new Set(s.log.filter((l) => input.evidence.includes(l.id)).flatMap((l) => l.bugs)),
  )
  if (evidenceBugs.length === 0) {
    return {
      status: 'rejected',
      quality: 0,
      feedback: [
        input.evidence.length === 0
          ? 'No has adjuntado evidencia: sin ella nadie puede reproducir el problema.'
          : 'La evidencia adjunta muestra un comportamiento conforme a la especificación actual.',
      ],
    }
  }
  const already = reportedBugIds({ ...s, reports: s.reports.filter((r) => r.key !== excludeKey) })
  // Si todas las evidencias comparten un bug, ese es el que se reporta; un
  // evento puede manifestar varios bugs a la vez (p. ej. un límite y un redondeo).
  const withBugs = s.log.filter((l) => input.evidence.includes(l.id) && l.bugs.length > 0)
  const common = evidenceBugs.filter((id) => withBugs.every((l) => l.bugs.includes(id)))
  const bugId = common.find((id) => !already.includes(id)) ?? evidenceBugs.find((id) => !already.includes(id))
  if (!bugId) {
    return { bugId: evidenceBugs[0], status: 'duplicate', quality: 0, feedback: ['Este bug ya estaba reportado.'] }
  }
  const bug = mission.bugs.find((b) => b.id === bugId)!

  let quality = 0
  if (input.title.trim().length >= 12) quality++
  else feedback.push('Título demasiado vago: debe decir qué falla y dónde.')
  if (input.steps.split('\n').filter((l) => l.trim().length > 0).length >= 2) quality++
  else feedback.push('Faltan pasos para reproducir (uno por línea).')
  if (input.expected.trim().length >= 5) quality++
  else feedback.push('Falta el resultado esperado.')
  if (input.actual.trim().length >= 5) quality++
  else feedback.push('Falta el resultado obtenido.')
  const diff = Math.abs(SEVERITY_ORDER.indexOf(input.severity) - SEVERITY_ORDER.indexOf(bug.severity))
  if (diff === 0) quality += 2
  else {
    if (diff === 1) quality += 1
    feedback.push(`Severidad: el equipo la ha reclasificado como ${SEVERITY_LABEL[bug.severity]}.`)
  }

  // Evidencia a granel: marcar todo para «acertar» no es un buen report.
  const attached = s.log.filter((l) => input.evidence.includes(l.id))
  const irrelevant = attached.filter((l) => !l.bugs.includes(bugId)).length
  if (attached.length > 2 && irrelevant > attached.length / 2) {
    quality -= 3
    feedback.push('Adjunta solo la evidencia que muestra el fallo: el resto confunde a quien lo tiene que reproducir.')
  }
  if (common.length === 0 && withBugs.length > 1) {
    quality -= 1
    feedback.push('La evidencia mezcla fallos distintos: un report, un bug.')
  }

  if (mission.reportPriority && bug.priority) {
    if (!input.priority) feedback.push('Falta la prioridad: ¿cuándo hay que arreglarlo?')
    else if (input.priority === bug.priority) quality += 1
    else {
      const pdiff = Math.abs(PRIORITY_ORDER.indexOf(input.priority) - PRIORITY_ORDER.indexOf(bug.priority))
      feedback.push(`Prioridad: en el triaje queda como ${PRIORITY_LABEL[bug.priority]}${bug.priorityWhy ? ` (${bug.priorityWhy})` : ''}.`)
      if (pdiff >= 2) quality -= 1
    }
  }

  if (bug.requiresFlag && !s.flags[bug.requiresFlag]) {
    return { bugId, status: 'disputed', quality, feedback: [bug.disputeReply ?? 'El equipo no está de acuerdo en que sea un bug.'] }
  }
  if (bug.repro) {
    const text = normalizeText(`${input.title}\n${input.steps}\n${input.actual}`)
    const missing = bug.repro.groups.some((g) => !g.some((term) => text.includes(normalizeText(term))))
    if (missing) return { bugId, status: 'needs_info', quality, feedback: [bug.repro.ask, ...feedback] }
  }
  return { bugId, status: quality >= 4 ? 'accepted' : 'needs_info', quality, feedback }
}

const REVIEW_REPLY: Record<ReportStatus, string> = {
  accepted: '',
  needs_info: 'He mirado {key} pero no consigo reproducirlo con lo que pone. {reason}',
  disputed: '{key}: {reason}',
  duplicate: '{key} es un duplicado, ya está reportado 😉',
  rejected: 'Cierro {key}: no veo el fallo en la evidencia que adjuntas.',
  resolved: '',
  verified: '',
  reopened: '',
}

function submitReport(mission: Mission, s: RunState, input: BugReportInput): void {
  const result = evaluateReport(mission, s, input)
  const key = `${mission.ticketPrefix}-${201 + s.reports.length}`
  s.reports.push({ ...input, key, at: s.clock, ...result })
  const add = (k: ScoreKey, n: number) => (s.scores[k] += n)
  switch (result.status) {
    case 'accepted':
      scheduleFix(mission, s, s.reports[s.reports.length - 1])
      add('rigor', result.quality >= 5 ? 2 : 1)
      if (result.bugId && bugSeverity(mission, result.bugId) === 'critical') add('risk', 1)
      break
    case 'rejected':
      add('rigor', -1)
      break
    case 'duplicate':
      add('efficiency', -1)
      break
    default:
      break
  }
  if (result.status !== 'accepted') {
    const reply = REVIEW_REPLY[result.status].replace('{key}', key).replace('{reason}', result.feedback[0] ?? '¿Me pasas pasos más claros?')
    pushMessage(s, mission.reportReviewer, reply)
  }
  advance(mission, s, mission.reportCost)
}

/** Completar un report devuelto: se vuelve a evaluar con la información nueva. */
function amendReport(mission: Mission, s: RunState, key: string, input: BugReportInput): void {
  const r = s.reports.find((x) => x.key === key)
  if (!r || !['needs_info', 'disputed'].includes(r.status)) return
  const result = evaluateReport(mission, s, input, key)
  Object.assign(r, input, result, { amendments: (r.amendments ?? 0) + 1 })
  if (result.status === 'accepted') {
    scheduleFix(mission, s, r)
    s.scores.rigor += 1
    s.notes.push({ at: s.clock, tone: 'neutral', text: `${key} se aceptó al completarlo (${r.amendments} ${r.amendments === 1 ? 'vuelta' : 'vueltas'} con ${npcName(mission, mission.reportReviewer)}).` })
    pushMessage(s, mission.reportReviewer, `Ahora sí reproduzco ${key} 👍 Me pongo con ello.`)
  } else {
    const reply = REVIEW_REPLY[result.status].replace('{key}', key).replace('{reason}', result.feedback[0] ?? '¿Me pasas pasos más claros?')
    pushMessage(s, mission.reportReviewer, reply)
  }
  advance(mission, s, Math.ceil(mission.reportCost / 2))
}

// ---------------------------------------------- Revisión de requisitos
function submitReview(mission: Mission, s: RunState): void {
  const model = mission.requirementsReview
  if (!model) return
  const pending = model.fragments.filter((f) => s.reviewMarks[f.id] && !s.reviewResults[f.id])
  const lines: string[] = []
  let falsePositives = 0
  // Lo que aportan otros revisores (p. ej. en la reunión de una inspección).
  for (const tf of model.teamFindings ?? []) {
    if (!evaluate(mission, s, tf.when)) continue
    for (const id of tf.fragmentIds) {
      const f = model.fragments.find((x) => x.id === id)
      if (!f?.issue || s.reviewResults[id] || pending.some((p) => p.id === id)) continue
      if (model.fragments.some((x) => x.issue?.key === f.issue!.key && s.reviewResults[x.id]?.correct)) continue
      s.reviewResults[id] = { at: s.clock, correct: true, typeOk: true, by: tf.by }
      if (s.flags[f.issue.clarifyFlag]) continue
      s.flags[f.issue.clarifyFlag] = true
      lines.push(`- «${shorten(f.text)}» (lo señala ${npcName(mission, tf.by)}): ${f.issue.clarification}`)
    }
  }
  for (const f of pending) {
    const marked = s.reviewMarks[f.id]
    if (f.issue) {
      const typeOk = f.issue.types.includes(marked)
      s.reviewResults[f.id] = { at: s.clock, correct: true, typeOk }
      if (s.flags[f.issue.clarifyFlag]) {
        lines.push(`- «${shorten(f.text)}»: ya lo aclaramos antes 😉`)
        continue
      }
      s.flags[f.issue.clarifyFlag] = true
      s.scores.rigor += 1
      const typeNote = typeOk ? '' : ` (Más que «${ISSUE_LABEL[marked].toLowerCase()}», yo diría «${ISSUE_LABEL[f.issue.types[0]].toLowerCase()}».)`
      lines.push(`- «${shorten(f.text)}»: ${f.issue.clarification}${typeNote}`)
    } else {
      s.reviewResults[f.id] = { at: s.clock, correct: false, typeOk: false }
      falsePositives += 1
      lines.push(`- «${shorten(f.text)}»: ${f.fineReply ?? 'esto creo que está claro tal como está.'}`)
    }
  }
  if (falsePositives >= 2) s.scores.rigor -= 1
  if (Object.keys(s.reviewResults).length > 0 && !s.flags['review.submitted']) {
    s.flags['review.submitted'] = true
    s.scores.communication += 1
  }
  if (!s.unlocked.includes('static_testing')) s.unlocked.push('static_testing')
  pushMessage(
    s,
    model.reviewer,
    lines.length
      ? `${model.teamFindings ? 'Acta de la revisión' : '¡Gracias por la revisión!'} Te respondo punto por punto (lo dejo también en ${model.storyId}):\n${lines.join('\n')}`
      : 'No veo dudas nuevas marcadas en la revisión. ¿Has seleccionado los fragmentos y el tipo de problema?',
  )
  advance(mission, s, model.submitCost)
}

function shorten(text: string): string {
  return text.length > 70 ? `${text.slice(0, 67)}…` : text
}

// ------------------------------------------------- Ciclo de vida del bug
function scheduleFix(mission: Mission, s: RunState, report: BugReport): void {
  const bug = mission.bugs.find((b) => b.id === report.bugId)
  if (!bug?.fix) return
  const at = s.clock + bug.fix.delay
  if (at >= mission.duration) return // no da tiempo hoy
  s.pendingFixes.push({ reportKey: report.key, at })
}

/** Despliega en staging los fixes cuyo momento ha llegado. */
function deployFixes(mission: Mission, s: RunState): void {
  const due = s.pendingFixes.filter((f) => f.at <= s.clock).sort((a, b) => a.at - b.at)
  if (due.length === 0) return
  s.pendingFixes = s.pendingFixes.filter((f) => f.at > s.clock)
  for (const f of due) {
    const report = s.reports.find((r) => r.key === f.reportKey)
    const bug = mission.bugs.find((b) => b.id === report?.bugId)
    if (!report || !bug?.fix) continue
    const attempt = report.fixAttempts ?? 0
    const outcome = bug.fix.attempts?.[attempt] ?? 'fixed'
    report.fixAttempts = attempt + 1
    report.deployedAt = f.at
    report.status = 'resolved'
    if (outcome === 'fixed' && !s.fixedBugs.includes(bug.id)) s.fixedBugs.push(bug.id)
    if (attempt === 0 && bug.fix.regression && !s.activeRegressions.includes(bug.fix.regression)) {
      s.activeRegressions.push(bug.fix.regression)
    }
    s.build += 1
    s.lastDeployAt = f.at
    s.flags['fix.deployed'] = true
    const note = bug.fix.note && attempt === 0 ? ` ${bug.fix.note}` : ''
    pushMessage(
      s,
      mission.reportReviewer,
      `He subido el fix de ${report.key} a staging (build rc${3 + s.build}).${note} ¿Me lo verificas y lo cierras si está bien?`,
    )
  }
}

function verifyReport(
  mission: Mission,
  s: RunState,
  action: { key: string; verdict: 'close' | 'reopen'; evidence: number[] },
): void {
  const report = s.reports.find((r) => r.key === action.key)
  if (!report || report.status !== 'resolved' || !report.bugId) return
  const deployedAt = report.deployedAt ?? 0
  const after = s.log.filter((l) => action.evidence.includes(l.id) && l.at >= deployedAt)
  const retested = after.length > 0
  const actuallyFixed = s.fixedBugs.includes(report.bugId)
  const stillFailsShown = after.some((l) => l.bugs.includes(report.bugId as string))
  const reviewer = mission.reportReviewer
  let correct: boolean
  if (action.verdict === 'close') {
    correct = actuallyFixed
    report.status = 'verified'
    if (!retested) {
      s.scores.rigor -= 1
      s.notes.push({ at: s.clock, tone: 'bad', text: `Cerraste ${report.key} sin volver a probarlo en el build nuevo.` })
    } else if (correct) {
      s.scores.rigor += 1
    }
    if (!correct) {
      s.scores.risk -= 2
      s.notes.push({ at: s.clock, tone: 'bad', text: `Cerraste ${report.key}, pero el fix no funcionaba: el bug sigue en staging camino de producción.` })
    }
  } else {
    correct = !actuallyFixed && stillFailsShown
    if (correct) {
      s.scores.rigor += 2
      report.status = 'reopened'
      s.notes.push({ at: s.clock, tone: 'good', text: `Detectaste que el fix de ${report.key} no funcionaba y lo reabriste con evidencia.` })
      pushMessage(s, reviewer, `Uf, tienes razón con ${report.key}: sigue fallando. Lo miro otra vez.`)
      scheduleFix(mission, s, report)
    } else {
      s.scores.rigor -= 1
      pushMessage(
        s,
        reviewer,
        retested
          ? `He vuelto a mirar ${report.key} y a mí me funciona. ¿Puedes adjuntar una ejecución del build nuevo donde falle?`
          : `Para reabrir ${report.key} necesito una ejecución en el build nuevo donde se vea el fallo.`,
      )
    }
  }
  report.verifications = [...(report.verifications ?? []), { at: s.clock, verdict: action.verdict, retested, correct }]
  advance(mission, s, mission.verifyCost ?? 5)
}

// --------------------------------------------------------- Herramientas
export function toolStatus(mission: Mission, s: RunState, tool: ToolId): 'enabled' | 'locked' | 'absent' {
  const rule = mission.tools.find((t) => t.tool === tool)
  if (!rule) return 'absent'
  return evaluate(mission, s, rule.enabledWhen) ? 'enabled' : 'locked'
}

export function pendingMeeting(s: RunState) {
  return s.messages.find((m) => m.channel === 'meeting' && !m.chosen && m.sceneId)
}

// ------------------------------------------------------------------ step
export function step(mission: Mission, state: RunState, action: Action): RunState {
  if (state.finished && action.type !== 'read' && action.type !== 'quizAnswer') return state
  const s: RunState = structuredClone(state)

  switch (action.type) {
    case 'start':
      if (!s.started) {
        s.started = true
        deliverDue(mission, s)
      }
      break
    case 'read': {
      const m = s.messages.find((x) => x.id === action.messageId)
      if (m) m.read = true
      break
    }
    case 'choose': {
      const m = s.messages.find((x) => x.id === action.messageId)
      if (!m || !m.sceneId || m.chosen) break
      const choice = sceneById(mission, m.sceneId).choices?.find((c) => c.id === action.choiceId)
      if (!choice || !evaluate(mission, s, choice.requires)) break
      m.chosen = choice.id
      m.read = true
      if (choice.reply) m.replies.push({ from: choice.replyFrom ?? m.from, body: choice.reply, at: s.clock })
      applyEffects(mission, s, choice.effects ?? [])
      if (!s.finished) advance(mission, s, choice.cost ?? 0)
      break
    }
    case 'readDoc': {
      const doc = mission.docs.find((d) => d.id === action.docId)
      if (!doc || s.docsRead.includes(doc.id)) break
      s.docsRead.push(doc.id)
      applyEffects(mission, s, doc.onRead ?? [])
      advance(mission, s, doc.readCost)
      break
    }
    case 'ticketAction': {
      const ticket = mission.tickets.find((t) => t.id === action.ticketId)
      const act = ticket?.actions.find((a) => a.id === action.actionId)
      const key = `${action.ticketId}:${action.actionId}`
      if (!act || s.ticketActionsDone.includes(key) || (act.hiddenWhen && evaluate(mission, s, act.hiddenWhen))) break
      s.ticketActionsDone.push(key)
      applyEffects(mission, s, act.effects)
      advance(mission, s, act.cost)
      break
    }
    case 'unlockTool': {
      const rule = mission.tools.find((t) => t.tool === action.tool)
      if (!rule?.unlockAction || toolStatus(mission, s, action.tool) !== 'locked') break
      applyEffects(mission, s, rule.unlockAction.effects)
      advance(mission, s, rule.unlockAction.cost)
      break
    }
    case 'app': {
      if (toolStatus(mission, s, 'app') !== 'enabled') break
      const { state: appSnapshot, ...event } = action.event
      if (appSnapshot !== undefined) s.appState[event.app] = appSnapshot
      s.log.push({ ...event, id: s.nextLogId++, at: s.clock })
      for (const b of action.event.bugs) if (!s.triggeredBugs.includes(b)) s.triggeredBugs.push(b)
      for (const f of action.event.flags ?? []) s.flags[f] = true
      advance(mission, s, Math.max(0, action.event.cost ?? mission.appActionCost))
      break
    }
    case 'report':
      submitReport(mission, s, action.report)
      break
    case 'amendReport':
      amendReport(mission, s, action.key, action.report)
      break
    case 'designAdd': {
      const model = mission.testDesign
      if (!model || !model.areas.some((a) => a.id === action.area)) break
      s.designCases.push({
        id: s.nextCaseId++,
        area: action.area,
        input: action.input.slice(0, 400),
        expectAccept: action.expectAccept,
        at: s.clock,
      })
      advance(mission, s, model.caseCost)
      break
    }
    case 'designRemove':
      s.designCases = s.designCases.filter((c) => c.id !== action.caseId)
      break
    case 'designResult': {
      const c = s.designCases.find((x) => x.id === action.caseId)
      if (c) {
        c.result = action.result ?? undefined
        c.resultAt = action.result ? s.clock : undefined
      }
      break
    }
    case 'askMentor': {
      const lesson = mission.lessons?.find((l) => l.id === action.lessonId)
      if (!lesson || s.lessonsRead.includes(lesson.id)) break
      s.lessonsRead.push(lesson.id)
      if (lesson.conceptId && !s.unlocked.includes(lesson.conceptId)) s.unlocked.push(lesson.conceptId)
      advance(mission, s, lesson.cost)
      break
    }
    case 'quizAnswer': {
      const questions = mission.quiz?.[action.phase] ?? []
      const q = questions.find((x) => x.id === action.questionId)
      // Pre: solo antes de empezar. Post: solo al terminar. Una respuesta por pregunta.
      if (!q || action.option < 0 || action.option >= q.options.length) break
      if (action.phase === 'pre' && s.started) break
      if (action.phase === 'post' && !s.finished) break
      if (s.quizAnswers[action.phase][q.id] !== undefined) break
      s.quizAnswers[action.phase][q.id] = action.option
      break
    }
    case 'aiReview': {
      // El resultado de la IA viaja dentro de la acción: la partida sigue
      // siendo reproducible sin volver a llamar al proveedor.
      const r = s.reports.find((x) => x.key === action.key)
      if (!r || r.aiReview) break
      const score = Math.max(0, Math.min(5, Math.round(action.score)))
      r.aiReview = {
        score,
        strengths: action.strengths.slice(0, 3),
        improvements: action.improvements.slice(0, 3),
        suggestedTitle: action.suggestedTitle.slice(0, 200),
      }
      if (score >= 4) s.scores.rigor += 1
      s.notes.push({
        at: s.clock,
        tone: score >= 4 ? 'good' : score >= 3 ? 'neutral' : 'bad',
        text: `${npcName(mission, mission.mentor ?? mission.reportReviewer)} valoró tu report ${r.key} con ${score}/5.`,
      })
      advance(mission, s, 5)
      break
    }
    case 'reviewMark': {
      const model = mission.requirementsReview
      if (!model?.fragments.some((f) => f.id === action.fragmentId) || s.reviewResults[action.fragmentId]) break
      if (action.issue) s.reviewMarks[action.fragmentId] = action.issue
      else delete s.reviewMarks[action.fragmentId]
      break
    }
    case 'reviewSubmit':
      submitReview(mission, s)
      break
    case 'riskRate': {
      if (!mission.riskModel?.items.some((i) => i.id === action.itemId)) break
      const clamp = (v: number) => Math.max(1, Math.min(3, Math.round(v))) as 1 | 2 | 3
      s.riskRatings[action.itemId] = { p: clamp(action.p), i: clamp(action.i) }
      break
    }
    case 'riskSubmit': {
      const model = mission.riskModel
      if (!model) break
      s.riskSubmissions += 1
      const assessment = riskAssessment(mission, s)
      if (s.riskSubmissions === 1 && assessment && assessment.rated === assessment.total) {
        s.scores.risk += assessment.good ? 2 : 0
        s.notes.push(
          assessment.good
            ? { at: s.clock, tone: 'good', text: 'Priorizaste por riesgo (probabilidad × impacto) y acertaste con las zonas críticas.' }
            : { at: s.clock, tone: 'neutral', text: 'Priorizaste por riesgo, aunque no diste con todas las zonas críticas.' },
        )
      }
      if (!s.unlocked.includes('risk_based')) s.unlocked.push('risk_based')
      pushMessage(s, model.reviewer, riskFeedback(mission, s))
      advance(mission, s, model.submitCost)
      break
    }
    case 'verifyReport':
      verifyReport(mission, s, action)
      break
    case 'designReview': {
      const model = mission.testDesign
      if (!model) break
      s.designReviews += 1
      pushMessage(s, model.reviewer, reviewMessage(mission, s, s.designReviews))
      if (!s.unlocked.includes('test_design')) s.unlocked.push('test_design')
      advance(mission, s, model.reviewCost)
      break
    }
    case 'wait':
      advance(mission, s, action.minutes)
      break
    case 'endDay':
      advance(mission, s, mission.duration)
      break
  }
  return s
}

export function replay(mission: Mission, seed: number, actions: Action[]): RunState {
  return actions.reduce((st, a) => step(mission, st, a), createRun(mission, seed))
}

// ------------------------------------------------------------------ reloj
export function clockLabel(mission: Mission, minutes: number): string {
  const total = mission.dayStart + minutes
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ---------------------------------------------------------------- debrief
export function stars(raw: number): number {
  return Math.max(0, Math.min(5, Math.round(2 + raw / 2)))
}

export interface MissionSummary {
  stars: Record<ScoreKey, number>
  bugs: {
    id: string
    title: string
    severity: Severity
    triggered: boolean
    reportStatus?: ReportStatus
    explanation: string
    technique: string
    regression: boolean
  }[]
  fixes: {
    key: string
    bugId: string
    title: string
    fixWorks: boolean
    firstFixWorks: boolean
    status: ReportStatus
    verifications: { at: number; verdict: 'close' | 'reopen'; retested: boolean; correct: boolean }[]
  }[]
  found: number
  total: number
  criticalMissed: number
  design: DesignCoverage | null
  verdict: { title: string; body: string; tone: 'good' | 'ok' | 'bad' }
  /** Calidad de cada report: idas y vueltas, severidad y prioridad frente a las del equipo. */
  reportQuality: {
    key: string
    title: string
    status: ReportStatus
    amendments: number
    severity: Severity
    realSeverity?: Severity
    priority?: Priority
    realPriority?: Priority
  }[]
}

export function summarize(mission: Mission, s: RunState): MissionSummary {
  const best = (bugId: string): ReportStatus | undefined => {
    const statuses = s.reports.filter((r) => r.bugId === bugId).map((r) => r.status)
    return (['verified', 'reopened', 'resolved', 'accepted', 'needs_info', 'disputed', 'duplicate', 'rejected'] as ReportStatus[]).find((st) => statuses.includes(st))
  }
  const visibleBugs = mission.bugs.filter((b) =>
    b.regression ? s.activeRegressions.includes(b.id) : s.activeBugs.includes(b.id) || s.triggeredBugs.includes(b.id),
  )
  const bugs = visibleBugs.map((b) => ({
    id: b.id,
    title: b.title,
    severity: b.severity,
    triggered: s.triggeredBugs.includes(b.id),
    reportStatus: best(b.id),
    explanation: b.explanation,
    technique: b.technique,
    regression: !!b.regression,
  }))
  const fixes = s.reports
    .filter((r) => r.bugId && (r.fixAttempts ?? 0) > 0)
    .map((r) => ({
      key: r.key,
      bugId: r.bugId as string,
      title: mission.bugs.find((b) => b.id === r.bugId)?.title ?? '',
      fixWorks: s.fixedBugs.includes(r.bugId as string),
      firstFixWorks: (mission.bugs.find((b) => b.id === r.bugId)?.fix?.attempts?.[0] ?? 'fixed') === 'fixed',
      status: r.status,
      verifications: r.verifications ?? [],
    }))
  const reported = reportedBugIds(s)
  const found = bugs.filter((b) => reported.includes(b.id)).length
  const criticalMissed = bugs.filter((b) => b.severity === 'critical' && !reported.includes(b.id)).length
  const design = designCoverage(mission, s)
  const st = {
    rigor: stars(s.scores.rigor + designRigorBonus(design)),
    communication: stars(s.scores.communication),
    risk: stars(s.scores.risk),
    efficiency: stars(s.scores.efficiency),
  }
  const avg = (st.rigor + st.communication + st.risk + st.efficiency) / 4
  const texts = mission.verdicts ?? {
    good: { title: 'Jornada superada con nota', body: 'El equipo sale de la reunión convencido de que puede contar con tu criterio.' },
    ok: { title: 'Jornada superada', body: 'Buen trabajo, con cosas que pulir. Revisa el debrief: casi todo lo que se escapó tiene una técnica concreta detrás.' },
    bad: { title: 'Jornada complicada', body: 'Nadie nace sabiendo. Repite la misión probando otras decisiones: verás cómo cambia el día.' },
  }
  const tone: MissionSummary['verdict']['tone'] = avg >= 3.5 && criticalMissed <= 1 ? 'good' : avg >= 2.5 ? 'ok' : 'bad'
  const verdict: MissionSummary['verdict'] = { ...texts[tone], tone }
  const reportQuality = s.reports
    .filter((r) => r.bugId && r.status !== 'duplicate' && r.status !== 'rejected')
    .map((r) => {
      const bug = mission.bugs.find((b) => b.id === r.bugId)
      return {
        key: r.key,
        title: r.title,
        status: r.status,
        amendments: r.amendments ?? 0,
        severity: r.severity,
        realSeverity: bug?.severity,
        priority: r.priority,
        realPriority: bug?.priority,
      }
    })
  return { stars: st, bugs, fixes, found, total: bugs.length, criticalMissed, design, verdict, reportQuality }
}

// ------------------------------------------------------------- quiz
export function quizScore(mission: Mission, s: RunState, phase: 'pre' | 'post') {
  const questions = mission.quiz?.[phase] ?? []
  const answers = s.quizAnswers[phase]
  return {
    total: questions.length,
    answered: questions.filter((q) => answers[q.id] !== undefined).length,
    correct: questions.filter((q) => answers[q.id] === q.correct).length,
  }
}

export function quizPending(mission: Mission, s: RunState, phase: 'pre' | 'post'): boolean {
  const sc = quizScore(mission, s, phase)
  return sc.total > 0 && sc.answered < sc.total
}
