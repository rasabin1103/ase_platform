import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 7: trazador de configuración (CTFL 5.4, 2.3 y 5.5).
 * Comparar entornos, encontrar el elemento sin control de versiones, decidir
 * qué build hay que probar, redactar el informe del defecto y analizar el
 * impacto de una migración para elegir la regresión.
 */

const APP = 'kobalto-config'

// ---------------------------------------------------------------- Entornos
export type EnvId = 'local' | 'staging' | 'prod'
export const ENVS: { id: EnvId; label: string }[] = [
  { id: 'local', label: 'Local de Tomás' },
  { id: 'staging', label: 'Staging' },
  { id: 'prod', label: 'Producción' },
]

export const ITEMS: { id: string; label: string; versioned: boolean; values: Record<EnvId, string> }[] = [
  { id: 'web', label: 'App web', versioned: true, values: { local: '1.4.2 · commit a91f', staging: '1.4.2 · commit a91f', prod: '1.4.1 · commit 7c02' } },
  { id: 'api', label: 'API de facturas', versioned: true, values: { local: 'build #412', staging: 'build #409', prod: 'build #405' } },
  { id: 'schema', label: 'Esquema de base de datos', versioned: true, values: { local: 'v37', staging: 'v37', prod: 'v36' } },
  { id: 'flag', label: 'Flag recurrent_invoices_v2', versioned: true, values: { local: 'activado', staging: 'activado', prod: 'desactivado' } },
  { id: 'config', label: 'Fichero billing.yml (redondeo del IVA)', versioned: false, values: { local: 'round: half_up', staging: 'round: down', prod: 'round: half_up' } },
  { id: 'data', label: 'Datos', versioned: true, values: { local: 'semilla de pruebas', staging: 'copia anonimizada', prod: 'reales' } },
]

/** Historial de builds de la API: qué cambios incluye cada una. */
export const BUILDS: { id: string; changes: string }[] = [
  { id: '#405', changes: 'Release 1.4.1 (producción).' },
  { id: '#409', changes: 'Facturas recurrentes v2 detrás de flag.' },
  { id: '#411', changes: 'Exportación CSV: cabeceras traducidas.' },
  { id: '#412', changes: 'EMP-231: corrige el vencimiento mensual de las facturas recurrentes.' },
]

export const CAUSE_OPTIONS = ITEMS.map((i) => ({ id: i.id, label: i.label }))
export const CORRECT_CAUSE = 'config'
export const CORRECT_UNVERSIONED = 'config'

export const BUILD_OPTIONS: { id: string; text: string; ok: boolean }[] = [
  { id: 'merged', text: 'Sí: el fix está mergeado en main, así que está en staging.', ok: false },
  { id: 'deploy412', text: 'No: staging tiene la build #409 y el fix entra en la #412. Hay que desplegar la #412 en staging y verificar sobre ella.', ok: true },
  { id: 'local', text: 'Sí: en el local de Tomás funciona, con eso basta.', ok: false },
]

// ------------------------------------------------------------ Inglés
/** En inglés, sustituye los textos de cada elemento (por id) conservando el resto de campos. */
function localize<T extends { id: string }>(list: T[], en: Record<string, Partial<T>>, lang: AcademyLang): T[] {
  return lang === 'en' ? list.map((x) => ({ ...x, ...en[x.id] })) : list
}

const ENVS_EN: Record<string, { label: string }> = { local: { label: "Tomás's local" }, staging: { label: 'Staging' }, prod: { label: 'Production' } }

const ITEMS_EN: Record<string, { label: string; values?: Record<EnvId, string> }> = {
  web: { label: 'Web app' },
  api: { label: 'Invoices API' },
  schema: { label: 'Database schema' },
  flag: { label: 'Flag recurrent_invoices_v2', values: { local: 'enabled', staging: 'enabled', prod: 'disabled' } },
  config: { label: 'billing.yml file (VAT rounding)' },
  data: { label: 'Data', values: { local: 'test seed', staging: 'anonymized copy', prod: 'real' } },
}

const BUILDS_EN: Record<string, { changes: string }> = {
  '#405': { changes: 'Release 1.4.1 (production).' },
  '#409': { changes: 'Recurring invoices v2 behind a flag.' },
  '#411': { changes: 'CSV export: translated headers.' },
  '#412': { changes: 'EMP-231: fixes the monthly due date of recurring invoices.' },
}

const BUILD_OPTIONS_EN: Record<string, { text: string }> = {
  merged: { text: "Yes: the fix is merged into main, so it's on staging." },
  deploy412: { text: 'No: staging has build #409 and the fix goes into #412. Build #412 has to be deployed to staging and verified there.' },
  local: { text: "Yes: it works on Tomás's local, that's enough." },
}

export const envsFor = (lang: AcademyLang = 'es'): typeof ENVS => localize(ENVS, ENVS_EN, lang)
export const itemsFor = (lang: AcademyLang = 'es'): typeof ITEMS => localize(ITEMS, ITEMS_EN, lang)
export const buildsFor = (lang: AcademyLang = 'es'): typeof BUILDS => localize(BUILDS, BUILDS_EN, lang)
export const causeOptionsFor = (lang: AcademyLang = 'es'): typeof CAUSE_OPTIONS => itemsFor(lang).map((i) => ({ id: i.id, label: i.label }))
export const buildOptionsFor = (lang: AcademyLang = 'es'): typeof BUILD_OPTIONS => localize(BUILD_OPTIONS, BUILD_OPTIONS_EN, lang)

// ---------------------------------------------------------------- Defecto
export const REPORT_FIELDS: { id: string; label: string; options: string[]; correct: number }[] = [
  {
    id: 'title',
    label: 'Título',
    options: ['El IVA está mal', 'Facturas recurrentes: el IVA se redondea a la baja (1 céntimo menos) en staging', 'URGENTE: bug en facturas'],
    correct: 1,
  },
  {
    id: 'env',
    label: 'Entorno y versiones',
    options: ['Staging', 'Staging · API build #409 · esquema v37 · flag recurrent_invoices_v2 activado · billing.yml round: down', 'El de siempre'],
    correct: 1,
  },
  {
    id: 'result',
    label: 'Resultado esperado y real',
    options: [
      'Esperado: base 33,33 € × 21 % = 7,00 € de IVA (redondeo al céntimo más próximo). Real: 6,99 €.',
      'Sale mal el IVA.',
      'Debería funcionar como en el local de Tomás.',
    ],
    correct: 0,
  },
]

const REPORT_FIELDS_EN: Record<string, { label: string; options: string[] }> = {
  title: {
    label: 'Title',
    options: ['VAT is wrong', 'Recurring invoices: VAT is rounded down (1 cent less) on staging', 'URGENT: invoices bug'],
  },
  env: {
    label: 'Environment and versions',
    options: ['Staging', 'Staging · API build #409 · schema v37 · flag recurrent_invoices_v2 enabled · billing.yml round: down', 'The usual one'],
  },
  result: {
    label: 'Expected and actual result',
    options: ['Expected: base €33.33 × 21% = €7.00 VAT (rounded to the nearest cent). Actual: €6.99.', 'The VAT comes out wrong.', "It should work like it does on Tomás's local."],
  },
}

/** Campos del informe en el idioma de la misión (mismos ids, orden de opciones y respuesta correcta). */
export const reportFieldsFor = (lang: AcademyLang = 'es'): typeof REPORT_FIELDS => localize(REPORT_FIELDS, REPORT_FIELDS_EN, lang)

// ------------------------------------------------------- Mantenimiento
export const TRIGGERS: { id: string; text: string }[] = [
  { id: 'modification', text: 'Modificación: una mejora o corrección planificada del propio sistema.' },
  { id: 'migration', text: 'Migración o actualización del entorno operativo: cambia una plataforma o un servicio del que dependemos.' },
  { id: 'retirement', text: 'Retirada: el sistema o una parte deja de usarse.' },
]
export const CORRECT_TRIGGER = 'migration'

export const SUITES: { id: string; label: string; days: number; impacted: boolean; why: string }[] = [
  { id: 'emit', label: 'Emisión de factura electrónica', days: 1, impacted: true, why: 'Llama directamente al proveedor.' },
  { id: 'recurrent', label: 'Facturas recurrentes', days: 1, impacted: true, why: 'Cada emisión pasa por el proveedor.' },
  { id: 'corrective', label: 'Facturas rectificativas', days: 0.5, impacted: true, why: 'Se envían al proveedor como factura nueva.' },
  { id: 'pdf', label: 'Descarga del PDF de la factura', days: 0.5, impacted: true, why: 'El PDF lo genera el proveedor.' },
  { id: 'cards', label: 'Tarjetas de equipo', days: 1, impacted: false, why: 'No usa el proveedor.' },
  { id: 'signup', label: 'Alta de cuenta de empresa', days: 0.5, impacted: false, why: 'No usa el proveedor.' },
  { id: 'csv', label: 'Exportar gastos a CSV', days: 0.5, impacted: false, why: 'No usa el proveedor.' },
  { id: 'login', label: 'Login y doble factor', days: 0.5, impacted: false, why: 'No usa el proveedor.' },
]

const TRIGGERS_EN: Record<string, { text: string }> = {
  modification: { text: 'Modification: a planned enhancement or fix of the system itself.' },
  migration: { text: 'Migration or upgrade of the operational environment: a platform or service we depend on changes.' },
  retirement: { text: 'Retirement: the system, or part of it, is no longer used.' },
}

const SUITES_EN: Record<string, { label: string; why: string }> = {
  emit: { label: 'E-invoice issuing', why: 'It calls the provider directly.' },
  recurrent: { label: 'Recurring invoices', why: 'Every issue goes through the provider.' },
  corrective: { label: 'Corrective invoices', why: 'They are sent to the provider as a new invoice.' },
  pdf: { label: 'Invoice PDF download', why: 'The PDF is generated by the provider.' },
  cards: { label: 'Team cards', why: "It doesn't use the provider." },
  signup: { label: 'Business account sign-up', why: "It doesn't use the provider." },
  csv: { label: 'Export expenses to CSV', why: "It doesn't use the provider." },
  login: { label: 'Login and two-factor authentication', why: "It doesn't use the provider." },
}

export const triggersFor = (lang: AcademyLang = 'es'): typeof TRIGGERS => localize(TRIGGERS, TRIGGERS_EN, lang)
export const suitesFor = (lang: AcademyLang = 'es'): typeof SUITES => localize(SUITES, SUITES_EN, lang)

// ------------------------------------------------------------------ Estado
export interface ConfigState {
  cause: string
  unversioned: string
  build: string
  report: Record<string, number>
  trigger: string
  suites: string[]
  submitted?: ConfigResult
  feedback?: string[]
}

export interface ConfigResult {
  cause: boolean
  unversioned: boolean
  build: boolean
  report: number
  trigger: boolean
  impact: boolean
  full: boolean
}

export const INITIAL_CONFIG: ConfigState = { cause: '', unversioned: '', build: '', report: {}, trigger: '', suites: [] }

const impactedIds = SUITES.filter((s) => s.impacted).map((s) => s.id)

export function regressionDays(ids: string[]): number {
  return SUITES.filter((s) => ids.includes(s.id)).reduce((n, s) => n + s.days, 0)
}

export function evaluate(p: ConfigState): ConfigResult {
  return {
    cause: p.cause === CORRECT_CAUSE,
    unversioned: p.unversioned === CORRECT_UNVERSIONED,
    build: BUILD_OPTIONS.find((b) => b.id === p.build)?.ok ?? false,
    report: REPORT_FIELDS.filter((f) => p.report[f.id] === f.correct).length,
    trigger: p.trigger === CORRECT_TRIGGER,
    impact: p.suites.length === impactedIds.length && impactedIds.every((id) => p.suites.includes(id)),
    full: p.suites.length === SUITES.length,
  }
}

export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

// ---------------------------------------------------------------- Acciones
export function edit(state: ConfigState, patch: Partial<ConfigState>, summary: string): { state: ConfigState; event: AppEvent } {
  return { state: { ...state, ...patch }, event: { app: APP, action: 'edit', summary, technical: 'config.edit', status: 'ok', bugs: [], cost: 0 } }
}

export function askLaura(state: ConfigState, lang: AcademyLang = 'es'): { state: ConfigState; event: AppEvent } {
  const r = evaluate(state)
  const fb: string[] = []
  if (lang === 'en') {
    if (!r.cause || !r.unversioned) fb.push("Compare environment by environment: what is different on staging and, on top of that, isn't under version control?")
    if (!r.build) fb.push('Before verifying a fix, check which build it goes into and which build is deployed.')
    if (r.report < REPORT_FIELDS.length) fb.push('The report is missing something for someone else to reproduce it: a specific title, exact versions, or the expected versus actual result.')
    if (!r.trigger) fb.push('What triggers this maintenance: a change of ours, or a change in something we depend on?')
    if (r.full) fb.push('Selecting everything is regression testing driven by fear, not by impact: what actually touches the provider?')
    else if (!r.impact) fb.push('Go over the impact analysis again: follow the path of each feature to the provider.')
    if (fb.length === 0) fb.push('Configuration traced, reproducible report and well-scoped impact. Send it.')
    return {
      state: { ...state, feedback: fb },
      event: { app: APP, action: 'ask_laura', summary: `Laura reviews the analysis: ${fb.join(' ')}`, technical: 'config.review', status: 'ok', bugs: [], cost: 10 },
    }
  }
  if (!r.cause || !r.unversioned) fb.push('Compara entorno por entorno: ¿qué es distinto en staging y además nadie lo ha versionado?')
  if (!r.build) fb.push('Antes de verificar un fix, comprueba en qué build entra y qué build hay desplegada.')
  if (r.report < REPORT_FIELDS.length) fb.push('Al informe le falta algo para que otro lo reproduzca: un título concreto, versiones exactas o el resultado esperado frente al real.')
  if (!r.trigger) fb.push('¿Qué dispara este mantenimiento: un cambio nuestro o un cambio en algo de lo que dependemos?')
  if (r.full) fb.push('Seleccionar todo es regresión por miedo, no por impacto: ¿qué toca realmente al proveedor?')
  else if (!r.impact) fb.push('Repasa el análisis de impacto: sigue el camino de cada funcionalidad hasta el proveedor.')
  if (fb.length === 0) fb.push('Configuración trazada, informe reproducible e impacto bien acotado. Envíalo.')
  return {
    state: { ...state, feedback: fb },
    event: { app: APP, action: 'ask_laura', summary: `Laura revisa el análisis: ${fb.join(' ')}`, technical: 'config.review', status: 'ok', bugs: [], cost: 10 },
  }
}

export function submit(state: ConfigState, lang: AcademyLang = 'es'): { state: ConfigState; event: AppEvent } {
  const r = evaluate(state)
  const flags = ['analysis.sent']
  if (r.cause) flags.push('config.found')
  if (r.unversioned) flags.push('config.unversioned')
  if (r.build) flags.push('build.ok')
  if (r.report === REPORT_FIELDS.length) flags.push('report.ok')
  if (r.trigger) flags.push('trigger.ok')
  if (r.impact) flags.push('impact.ok')
  if (r.full) flags.push('regression.fear')
  return {
    state: { ...state, submitted: r, feedback: undefined },
    event: {
      app: APP,
      action: 'submit',
      summary:
        lang === 'en'
          ? `Analysis sent: cause ${r.cause ? 'in the configuration' : 'not found'}, build to test ${r.build ? 'correct' : 'wrong'}, report ${r.report}/${REPORT_FIELDS.length}, ${regressionDays(state.suites)}-day regression${r.impact ? ' scoped to the impact' : ''}.`
          : `Análisis enviado: causa ${r.cause ? 'en la configuración' : 'sin encontrar'}, build a probar ${r.build ? 'correcta' : 'equivocada'}, informe ${r.report}/${REPORT_FIELDS.length}, regresión de ${regressionDays(state.suites)} días${r.impact ? ' acotada al impacto' : ''}.`,
      technical: `config.submit ${JSON.stringify(r)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}
