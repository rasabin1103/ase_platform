/**
 * ASE Academy — tipos del motor de simulación.
 *
 * El motor es genérico: no sabe nada de testing ni de bancos. Todo lo
 * específico de un curso (personajes, escenas, bugs, documentos) es
 * contenido tipado que cumple estos contratos. Ver docs/academy/PLAN.md §3 y §8.
 */

export type ScoreKey = 'rigor' | 'communication' | 'risk' | 'efficiency'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
/** Prioridad de negocio (cuándo se arregla), independiente de la severidad (cuánto daña). */
export type Priority = 'p1' | 'p2' | 'p3' | 'p4'
export type Channel = 'email' | 'chat' | 'meeting'
export type ToolId = 'mail' | 'chat' | 'tickets' | 'review' | 'design' | 'wiki' | 'app' | 'logs'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

// ---------------------------------------------------------------- Condiciones
export type Condition =
  | { kind: 'flag'; key: string }
  | { kind: 'notFlag'; key: string }
  | { kind: 'metricGte'; key: string; value: number }
  | { kind: 'metricLt'; key: string; value: number }
  | { kind: 'bugTriggered'; bugId?: string; severity?: Severity }
  | { kind: 'bugReported'; bugId?: string; severity?: Severity }
  /** Hay un report verificado y cerrado (fix comprobado) de un bug que cumple el filtro. */
  | { kind: 'bugVerified'; bugId?: string; severity?: Severity }
  | { kind: 'reportsGte'; value: number }
  | { kind: 'reportsLt'; value: number }
  /** Cobertura de particiones clave del diseño de pruebas (0–1). */
  | { kind: 'designCoverageGte'; value: number }
  | { kind: 'all'; of: Condition[] }
  | { kind: 'any'; of: Condition[] }
  | { kind: 'not'; of: Condition }

// ------------------------------------------------------------------- Efectos
export type Effect =
  | { kind: 'flag'; key: string; value?: boolean }
  | { kind: 'metric'; key: string; add: number }
  | { kind: 'score'; key: ScoreKey; add: number }
  | { kind: 'time'; add: number }
  | { kind: 'deliver'; sceneId: string }
  | { kind: 'unlock'; conceptId: string }
  /** Entrada del diario de decisiones que se muestra en el debrief. */
  | { kind: 'note'; text: string; tone: 'good' | 'bad' | 'neutral' }
  /** Congela el desarrollo: los bugs con `preventedBy` aclarado no llegan a existir. */
  | { kind: 'preventBugs' }
  /** Efecto que solo se aplica si se cumple la condición. */
  | { kind: 'if'; when: Condition; then: Effect[]; else?: Effect[] }
  | { kind: 'endMission' }

// ------------------------------------------------------------------ Contenido
export interface Npc {
  id: string
  name: string
  role: string
  /** Iniciales o emoji para el avatar. */
  avatar: string
  color: string
}

export interface World {
  id: string
  company: string
  sector: string
  tagline: string
  npcs: Npc[]
}

export interface Choice {
  id: string
  text: string
  requires?: Condition
  /** Minutos de jornada que consume la decisión. */
  cost?: number
  effects?: Effect[]
  /** Respuesta inmediata del NPC tras elegir. */
  reply?: string
  replyFrom?: string
}

export interface Scene {
  id: string
  channel: Channel
  from: string
  /** Participantes adicionales (reuniones). */
  with?: string[]
  subject?: string
  body: string
  /** Minuto de la jornada a partir del cual puede aparecer. Sin `at` ni
   * `when`, la escena solo llega mediante un efecto `deliver`. */
  at?: number
  when?: Condition
  /** Imprevistos: probabilidad (0–1) evaluada una vez con la semilla. */
  probability?: number
  choices?: Choice[]
  /** Efectos al recibir la escena (p. ej. desbloquear un concepto). */
  onDeliver?: Effect[]
}

export interface Doc {
  id: string
  title: string
  updatedLabel: string
  /** Markdown ligero: párrafos, `## títulos` y listas con `- `. */
  body: string
  readCost: number
  onRead?: Effect[]
  visibleWhen?: Condition
}

export interface TicketAction {
  id: string
  label: string
  cost: number
  effects: Effect[]
  hiddenWhen?: Condition
}

export interface TicketComment {
  author: string
  body: string
  visibleWhen?: Condition
}

export interface Ticket {
  id: string
  title: string
  status: string
  type: 'story' | 'bug'
  description: string
  acceptanceCriteria: string[]
  comments: TicketComment[]
  actions: TicketAction[]
}

export interface BugDef {
  id: string
  title: string
  severity: Severity
  /** Sin este flag el dev rebate el bug ("¿dónde pone que es un bug?"). */
  requiresFlag?: string
  disputeReply?: string
  explanation: string
  technique: string
  /** Corrección que hará el equipo tras aceptar el bug (ciclo de vida). */
  fix?: BugFix
  /** Si este flag (una aclaración) está activo cuando empieza el desarrollo, el bug no llega a existir. */
  preventedBy?: string
  /** Bug que solo existe si lo introduce el fix de otro bug (regresión). */
  regression?: boolean
  /** Prioridad de referencia (la que fija el equipo en el triaje) y por qué. */
  priority?: Priority
  priorityWhy?: string
  /**
   * Condiciones sin las que el dev no lo reproduce: el título, los pasos o el
   * resultado deben mencionar al menos un término de cada grupo (sin tildes).
   */
  repro?: { groups: string[][]; ask: string }
}

export interface BugFix {
  /** Minutos de jornada desde que se acepta (o se reabre) hasta el despliegue. */
  delay: number
  /** Resultado de cada intento de corrección; por defecto, 'fixed'. */
  attempts?: ('fixed' | 'not_fixed')[]
  /** Bug (regression: true) que introduce el primer despliegue del fix. */
  regression?: string
  /** Texto del dev al desplegar. */
  note?: string
}

export interface Concept {
  id: string
  title: string
  summary: string
}

// ---------------------------------------------- Revisión de requisitos (estática)
export type IssueType = 'ambiguous' | 'incomplete' | 'contradictory' | 'untestable'

export interface ReqFragment {
  id: string
  /** Sección del documento (por defecto, 'description' o 'criteria'; ver RequirementsReviewModel.sections). */
  section: string
  text: string
  /** Defecto real del requisito. Sin `issue`, el fragmento está bien. */
  issue?: {
    /** Tipos que se consideran correctos. */
    types: IssueType[]
    /** Fragmentos que comparten clave son el mismo defecto (p. ej. una contradicción). */
    key: string
    explanation: string
    clarifyFlag: string
    clarification: string
  }
  /** Respuesta de la PO si se marca como problema y no lo es. */
  fineReply?: string
}

export interface RequirementsReviewModel {
  storyId: string
  fragments: ReqFragment[]
  reviewer: string
  submitCost: number
  /** Textos propios de la herramienta (por defecto, los de la revisión de una historia). */
  title?: string
  intro?: string
  submitLabel?: string
  /** Secciones del documento en orden (por defecto, Descripción y Criterios de aceptación). */
  sections?: { id: string; label: string }[]
  /**
   * Defectos que aportan otros revisores al enviar (p. ej. en la reunión de
   * una inspección), si se cumple la condición: quién revisa y cómo se preparó.
   */
  teamFindings?: { by: string; when?: Condition; fragmentIds: string[] }[]
}

// ------------------------------------------------------ Priorización por riesgo
export type RiskLevel = 1 | 2 | 3

export interface RiskItem {
  id: string
  label: string
  description: string
  /** Valoración de referencia (la de un QA senior) y por qué. */
  reference: { p: RiskLevel; i: RiskLevel; why: string }
}

export interface RiskModel {
  items: RiskItem[]
  /** Cuántas zonas se consideran «prioridad» (las de mayor riesgo). */
  topN: number
  submitCost: number
  reviewer: string
}

// ------------------------------------------------------ Test antes y después
export interface QuizQuestion {
  id: string
  conceptId?: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export type QuizPhase = 'pre' | 'post'

/** Microlección del mentor: teoría breve en el momento en que se necesita. */
export interface Lesson {
  id: string
  /** Pregunta tal como la haría el alumno. */
  question: string
  /** Markdown ligero (párrafos, listas, **negrita**). */
  body: string
  conceptId?: string
  cost: number
}

export interface ToolRule {
  tool: ToolId
  /** Si no se cumple, la herramienta aparece bloqueada. */
  enabledWhen?: Condition
  lockedMessage?: string
  unlockAction?: { label: string; cost: number; effects: Effect[] }
}

// ------------------------------------------------------- Diseño de pruebas
export interface DesignPartition {
  id: string
  label: string
  /** Técnica que la cubre (se muestra en el feedback y el debrief). */
  technique: string
  /** Cuenta para la cobertura mínima esperada. */
  core?: boolean
  /** Pista genérica para la primera revisión (sin revelar el valor). */
  hint: string
  /** Sin este flag el alumno no puede saber el resultado esperado. */
  requiresFlag?: string
}

export interface DesignArea {
  id: string
  label: string
  inputLabel: string
  inputPlaceholder: string
  /** Pregunta que responde el resultado esperado (p. ej. «¿Se acepta?»). */
  expectedQuestion: string
  /** Cómo se lee el esperado en la tabla de casos (por defecto «Se acepta» / «Se rechaza»). */
  expectedLabels?: { yes: string; no: string }
  partitions: DesignPartition[]
}

/**
 * Modelo de cobertura de una misión. Las funciones son contenido: el motor
 * solo las invoca, así que cada curso define sus propias reglas.
 */
export interface TestDesignModel {
  storyId: string
  /** Texto de introducción del diseño (si no se indica, uno genérico de particiones). */
  intro?: string
  areas: DesignArea[]
  /** Particiones (ids) que cubre un caso. */
  classify: (areaId: string, input: string) => string[]
  /** Resultado correcto según la especificación real: true = se acepta. */
  expected: (areaId: string, input: string) => boolean | undefined
  /** Bug sembrado que revelaría el caso al ejecutarlo. */
  reveals?: (areaId: string, input: string, activeBugs: string[]) => string | undefined
  /** Valores para precargar la app bajo prueba al ejecutar el caso. */
  prefill?: (areaId: string, input: string) => Record<string, string>
  caseCost: number
  reviewCost: number
  reviewer: string
}

export interface Mission {
  id: string
  courseKey: string
  number: number
  title: string
  subtitle: string
  world: World
  playerRole: string
  /** Hora del reloj (minutos desde medianoche) al empezar. */
  dayStart: number
  dayLabel: string
  duration: number
  briefing: { title: string; paragraphs: string[]; goals: string[] }
  tools: ToolRule[]
  scenes: Scene[]
  /** Escena (reunión) que cierra la jornada al llegar al final del tiempo. */
  endSceneId: string
  docs: Doc[]
  tickets: Ticket[]
  bugs: BugDef[]
  concepts: Concept[]
  /** Conceptos que siempre se muestran en el debrief. */
  debriefConcepts: string[]
  seniorTips: string[]
  /** Coste en minutos de una acción en la app bajo prueba. */
  appActionCost: number
  reportCost: number
  /** Coste en minutos de verificar un fix. */
  verifyCost?: number
  /** NPC que revisa los bug reports y responde por chat si hay pegas. */
  reportReviewer: string
  /** Prefijo de los tickets de bug que crea el jugador (p. ej. KOB). */
  ticketPrefix: string
  initialMetrics: Record<string, number>
  testDesign?: TestDesignModel
  /** Textos del veredicto final (si no se indican, se usan unos genéricos). */
  verdicts?: Record<'good' | 'ok' | 'bad', { title: string; body: string }>
  riskModel?: RiskModel
  requirementsReview?: RequirementsReviewModel
  /** App bajo prueba que se abre en la herramienta «app» (ver apps/registry). */
  appId?: string
  /** Diagnóstico antes de empezar y comprobación al terminar (mismos conceptos). */
  quiz?: { pre: QuizQuestion[]; post: QuizQuestion[] }
  /** Microlecciones del mentor («Pregúntale a…»). */
  lessons?: Lesson[]
  mentor?: string
  /** Huecos de bugs: la semilla elige una variante de cada uno por partida. */
  bugSlots?: { slot: string; options: string[] }[]
  /** El formulario de bug pide prioridad además de severidad. */
  reportPriority?: boolean
  /** Nombre de la herramienta «app» en el escritorio (por defecto, «Staging»). */
  appLabel?: string
  /** Oculta la lista de bugs del debrief (misiones sin app donde encontrarlos). */
  hideBugList?: boolean
  /**
   * Debrief de prevención para misiones sin revisión de requisitos: qué reglas
   * (flags) dejó cubiertas el jugador y qué bugs evitó o dejó nacer.
   */
  prevention?: {
    title: string
    intro: string
    rules: { flag: string; label: string; explanation: string }[]
    preventedLabel: string
    appearedLabel: string
  }
}

export interface CourseDef {
  key: string
  title: string
  track: string
  level: CourseLevel
  description: string
  estimatedHours: number
  /**
   * Regla comercial (no se configura aquí): si el ítem del catálogo es
   * gratuito, todo el curso es libre; si tiene precio, solo la primera misión
   * es libre y el resto requiere comprarlo. Ver isFreeMission().
   */
  missions: { id: string; title: string; available: boolean }[]
}

// --------------------------------------------------------------------- Estado
export interface AppEvent {
  app: string
  action: string
  /** Texto legible para el historial/logs. */
  summary: string
  /** Línea técnica para la herramienta de logs. */
  technical: string
  status: 'ok' | 'error'
  /** Bugs sembrados que se han manifestado en este evento. */
  bugs: string[]
  /** Estado de la app tras el evento; el motor lo guarda para poder reanudar. */
  state?: unknown
  /** Minutos que consume esta acción (por defecto, Mission.appActionCost). */
  cost?: number
  /** Flags que la acción activa (p. ej. el resultado de enviar un plan). */
  flags?: string[]
}

export interface LogEntry extends Omit<AppEvent, 'state'> {
  id: number
  at: number
}

export interface Message {
  id: number
  sceneId?: string
  channel: Channel
  from: string
  with?: string[]
  subject?: string
  body: string
  at: number
  read: boolean
  chosen?: string
  replies: { from: string; body: string; at: number }[]
}

export interface BugReportInput {
  title: string
  steps: string
  expected: string
  actual: string
  severity: Severity
  priority?: Priority
  evidence: number[]
}

export type ReportStatus =
  | 'accepted'
  | 'needs_info'
  | 'disputed'
  | 'duplicate'
  | 'rejected'
  /** Fix desplegado en staging, pendiente de que QA lo verifique. */
  | 'resolved'
  /** QA lo ha verificado y cerrado. */
  | 'verified'
  /** QA ha comprobado que sigue fallando. */
  | 'reopened'

export interface Verification {
  at: number
  verdict: 'close' | 'reopen'
  /** Hay evidencia ejecutada en el build con el fix. */
  retested: boolean
  correct: boolean
}

export interface BugReport extends BugReportInput {
  key: string
  at: number
  bugId?: string
  status: ReportStatus
  quality: number
  feedback: string[]
  /** Minuto del último despliegue de un fix para este bug. */
  deployedAt?: number
  fixAttempts?: number
  verifications?: Verification[]
  /** Revisión cualitativa de la mentora generada por IA (si está disponible). */
  aiReview?: { score: number; strengths: string[]; improvements: string[]; suggestedTitle: string }
  /** Veces que el report se ha completado tras pedir información. */
  amendments?: number
}

export type CaseResult = 'pass' | 'fail' | 'blocked'

export interface DesignCase {
  id: number
  area: string
  input: string
  /** Lo que el alumno espera: true = se acepta. */
  expectAccept: boolean
  result?: CaseResult
  resultAt?: number
  at: number
}

export interface Note {
  at: number
  text: string
  tone: 'good' | 'bad' | 'neutral'
}

export interface RunState {
  missionId: string
  seed: number
  rng: number
  clock: number
  started: boolean
  finished: boolean
  flags: Record<string, boolean>
  metrics: Record<string, number>
  scores: Record<ScoreKey, number>
  messages: Message[]
  nextMessageId: number
  /** Escenas ya procesadas por el planificador (entregadas o descartadas). */
  processedScenes: string[]
  docsRead: string[]
  ticketActionsDone: string[]
  log: LogEntry[]
  nextLogId: number
  /** Último estado conocido de cada app bajo prueba (por id de app). */
  appState: Record<string, unknown>
  triggeredBugs: string[]
  reports: BugReport[]
  unlocked: string[]
  notes: Note[]
  designCases: DesignCase[]
  nextCaseId: number
  designReviews: number
  lessonsRead: string[]
  reviewMarks: Record<string, IssueType>
  reviewResults: Record<string, { at: number; correct: boolean; typeOk: boolean; by?: string }>
  preventedBugs: string[]
  quizAnswers: { pre: Record<string, number>; post: Record<string, number> }
  riskRatings: Record<string, { p: RiskLevel; i: RiskLevel }>
  riskSubmissions: number
  /** Bugs sembrados en esta partida (una variante por hueco). */
  activeBugs: string[]
  /** Ciclo de vida: fixes pendientes de desplegar y estado del build de staging. */
  pendingFixes: { reportKey: string; at: number }[]
  fixedBugs: string[]
  activeRegressions: string[]
  build: number
  lastDeployAt?: number
}

export type Action =
  | { type: 'start' }
  | { type: 'read'; messageId: number }
  | { type: 'choose'; messageId: number; choiceId: string }
  | { type: 'readDoc'; docId: string }
  | { type: 'ticketAction'; ticketId: string; actionId: string }
  | { type: 'unlockTool'; tool: ToolId }
  | { type: 'app'; event: AppEvent }
  | { type: 'report'; report: BugReportInput }
  /** Completar un report que el dev devolvió (necesita info o en discusión). */
  | { type: 'amendReport'; key: string; report: BugReportInput }
  | { type: 'designAdd'; area: string; input: string; expectAccept: boolean }
  | { type: 'designRemove'; caseId: number }
  | { type: 'designResult'; caseId: number; result: CaseResult | null }
  | { type: 'designReview' }
  | { type: 'askMentor'; lessonId: string }
  | { type: 'riskRate'; itemId: string; p: RiskLevel; i: RiskLevel }
  | { type: 'riskSubmit' }
  | { type: 'reviewMark'; fragmentId: string; issue: IssueType | null }
  | { type: 'reviewSubmit' }
  | { type: 'aiReview'; key: string; score: number; strengths: string[]; improvements: string[]; suggestedTitle: string }
  | { type: 'quizAnswer'; phase: QuizPhase; questionId: string; option: number }
  | { type: 'verifyReport'; key: string; verdict: 'close' | 'reopen'; evidence: number[] }
  | { type: 'wait'; minutes: number }
  | { type: 'endDay' }
