/**
 * Lógica del IDE de Karate (sin React): ejecutar el proyecto contra la API
 * simulada y convertir el resultado en eventos del motor (logs, bugs
 * revelados, flags de retos y malos olores).
 */
import { evaluate } from '../../engine/engine'
import type { AppEvent, Mission, RunState } from '../../engine/types'
import { runProject, type RunResult, type ScenarioResult } from '../../karate/runner'
import type { CodeLabModel, PipelineContext } from '../../karate/types'
import { parseRunner } from '../../karate/pipeline'
import { tr, type AcademyLang } from '../../i18n'

export const IDE_APP = 'karate-ide'

export interface IdeScenarioSummary {
  file: string
  name: string
  line: number
  status: 'passed' | 'failed'
  error?: { line: number; message: string }
}

/** Resumen de una ejecución del pipeline (lo que enseñaría Jenkins o GitHub Actions). */
export interface PipelineSummary {
  job: string
  label: string
  run: number
  build: 'SUCCESS' | 'FAILURE'
  /** Motivo del resultado del build. */
  reason: string
  command: string
  threads: number
  tags: string
  scenarios: number
  failed: number
  wallMs: number
  reports: string[]
  compileErrors: string[]
}

export interface IdeState {
  files: Record<string, string>
  runs: number
  last?: { passed: number; failed: number; errors: number; at: number; scenarios: IdeScenarioSummary[]; syntax: { file: string; line: number; message: string }[] }
  /** Pipeline de CI: ejecuciones, rachas sin fallos propios por job y última ejecución. */
  pipeline?: { runs: number; streaks: Record<string, number>; last?: PipelineSummary }
}

export function initialIdeState(model: CodeLabModel): IdeState {
  return { files: Object.fromEntries(model.files.map((f) => [f.path, f.content])), runs: 0 }
}

export function ideState(model: CodeLabModel, state: RunState): IdeState {
  return (state.appState[IDE_APP] as IdeState | undefined) ?? initialIdeState(model)
}

/** Bugs que sirve la API ahora mismo: los sembrados que no se han arreglado y las regresiones. */
export function liveBugs(state: Pick<RunState, 'activeBugs' | 'fixedBugs' | 'activeRegressions'>): string[] {
  return [...state.activeBugs.filter((b) => !state.fixedBugs.includes(b)), ...state.activeRegressions]
}

export function visibleRetos(mission: Mission, state: RunState) {
  const model = mission.codeLab
  if (!model) return []
  return model.retos.filter((r) => !r.visibleWhen || evaluate(mission, state, r.visibleWhen))
}

export interface LabRun {
  result: RunResult
  events: AppEvent[]
  next: IdeState
  /** Retos que esta ejecución ha cumplido por primera vez. */
  newRetos: string[]
  /** Solo si se ejecutó un job del pipeline. */
  pipeline?: PipelineSummary
}

function firstLine(s: string): string {
  const lines = s.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.slice(0, lines[0]?.startsWith('match failed') ? 4 : 1).join(' · ')
}

function scenarioSummary(sc: ScenarioResult, lang: AcademyLang): string {
  const name = sc.name || tr(lang, '(sin nombre)', '(unnamed)')
  return `${sc.file.split('/').pop()}:${sc.outline?.line ?? sc.line} · ${name} — ${sc.status === 'passed' ? tr(lang, 'pasa', 'passed') : tr(lang, 'FALLA', 'FAILED')}`
}

function scenarioTechnical(sc: ScenarioResult): string {
  const reqs = sc.requests.map((r) => `${r.method} ${r.path}${Object.keys(r.query).length ? '?' + Object.entries(r.query).map(([k, v]) => `${k}=${v.join(',')}`).join('&') : ''} → ${r.status}`).join(' ; ')
  const err = sc.error ? ` | line ${sc.error.line}: ${firstLine(sc.error.message)}` : ''
  return `[karate] ${sc.file}:${sc.outline?.line ?? sc.line} Scenario: ${sc.name} | ${sc.status.toUpperCase()}${reqs ? ' | ' + reqs : ''}${err}`
}

/** Entorno elegido (karate.env) y sus propiedades. */
export function labEnv(model: CodeLabModel, envId?: string) {
  const env = model.envs?.find((e) => e.id === envId) ?? model.envs?.[0]
  return { id: env?.id ?? model.env ?? '', properties: env?.properties ?? {} }
}

export function runLab(mission: Mission, state: RunState, files: Record<string, string>, opts: { tags?: string[]; only?: string; env?: string; job?: string } = {}): LabRun {
  const model = mission.codeLab!
  const lang: AcademyLang = mission.lang === 'en' ? 'en' : 'es'
  const server = model.server(state.flags)
  const env = labEnv(model, opts.env)
  const prev = ideState(model, state)
  const job = opts.job ? model.pipeline?.jobs.find((j) => j.id === opts.job) : undefined
  let pipeline: PipelineSummary | undefined
  let ctxPipeline: PipelineContext | undefined
  let result: RunResult
  if (job) {
    // Pipeline de CI: el runner Java decide qué se ejecuta, con cuántos hilos y si el build falla.
    const runNo = (prev.pipeline?.runs ?? 0) + 1
    const spec = parseRunner(job.runner, files[job.runner] ?? '')
    const tags = spec.tagGroups.map((g) => g.map((t) => (t.startsWith('~') ? '~@' + t.slice(1) : '@' + t)).join(',')).join(' ')
    const command = `mvn test -Dtest=${spec.className}`
    if (spec.errors.length) {
      result = { features: [], passed: 0, failed: 0, errors: 0, ms: 0, wallMs: 0 }
      pipeline = { job: job.id, label: job.label, run: runNo, build: 'FAILURE', reason: 'COMPILATION ERROR', command, threads: spec.threads, tags, scenarios: 0, failed: 0, wallMs: 0, reports: spec.reports, compileErrors: spec.errors }
    } else {
      result = runProject(
        {
          files,
          config: model.config,
          env: env.id || undefined,
          properties: env.properties,
          configSource: model.configFile ? files[model.configFile] : undefined,
          root: spec.root ?? undefined,
          tagGroups: spec.tagGroups,
          parallel: { threads: spec.threads, seed: runNo },
        },
        server,
        liveBugs(state),
      )
      const failed = result.failed + result.errors
      const build = spec.asserts && failed > 0 ? 'FAILURE' : 'SUCCESS'
      const reason =
        build === 'FAILURE'
          ? tr(lang, `${failed} escenario(s) fallido(s)`, `${failed} failed scenario(s)`)
          : failed > 0
            ? tr(lang, `${failed} escenario(s) fallido(s), pero el runner no lo comprueba`, `${failed} failed scenario(s), but the runner does not check it`)
            : tr(lang, 'todos los escenarios pasan', 'all scenarios passed')
      pipeline = { job: job.id, label: job.label, run: runNo, build, reason, command, threads: spec.threads, tags, scenarios: result.passed + result.failed, failed, wallMs: result.wallMs ?? 0, reports: spec.reports, compileErrors: [] }
    }
    const all = result.features.flatMap((f) => f.scenarios)
    // Racha: ejecuciones seguidas del job sin fallos achacables a los tests.
    const ownFail = spec.errors.length > 0 || result.errors > 0 || all.length === 0 || all.some((sc) => sc.status === 'failed' && sc.revealed.length === 0)
    const streak = ownFail ? 0 : (prev.pipeline?.streaks[job.id] ?? 0) + 1
    ctxPipeline = { job: job.id, run: runNo, spec, build: pipeline.build, wallMs: pipeline.wallMs, streak }
  } else {
    result = runProject(
      {
        files,
        config: model.config,
        env: env.id || undefined,
        properties: env.properties,
        configSource: model.configFile ? files[model.configFile] : undefined,
        tags: opts.tags,
        only: opts.only,
      },
      server,
      liveBugs(state),
    )
  }
  const scenarios = result.features.flatMap((f) => f.scenarios)
  const events: AppEvent[] = []
  let cost = model.runCost
  if (pipeline) {
    const ok = pipeline.build === 'SUCCESS'
    events.push({
      app: IDE_APP,
      action: 'pipeline',
      summary: tr(
        lang,
        `Pipeline #${pipeline.run} · ${pipeline.label}: BUILD ${pipeline.build} (${pipeline.reason})`,
        `Pipeline #${pipeline.run} · ${pipeline.label}: BUILD ${pipeline.build} (${pipeline.reason})`,
      ),
      technical: `[ci] ${pipeline.command} · threads=${pipeline.threads} · tags=${pipeline.tags || '-'} · scenarios=${pipeline.scenarios} · failed=${pipeline.failed} · ${(pipeline.wallMs / 1000).toFixed(1)}s${pipeline.compileErrors.length ? ' · ' + pipeline.compileErrors.join('; ') : ''}`,
      status: ok && pipeline.failed === 0 ? 'ok' : 'error',
      bugs: [],
      cost: model.pipeline?.cost ?? model.runCost,
    })
    cost = 0
  }
  for (const f of result.features) {
    if (!f.error) continue
    events.push({
      app: IDE_APP,
      action: 'syntax',
      summary: tr(lang, `${f.file}: error de sintaxis en la línea ${f.error.line}`, `${f.file}: syntax error on line ${f.error.line}`),
      technical: `[karate] ${f.file}:${f.error.line} ${f.error.message}`,
      status: 'error',
      bugs: [],
      cost,
    })
    cost = 0
  }
  for (const sc of scenarios) {
    events.push({
      app: IDE_APP,
      action: 'scenario',
      summary: scenarioSummary(sc, lang) + (env.id && model.envs ? ` [${env.id}]` : ''),
      technical: scenarioTechnical(sc),
      status: sc.status === 'passed' ? 'ok' : 'error',
      bugs: sc.revealed,
      cost,
    })
    cost = pipeline ? 0 : model.scenarioCost
  }
  // Retos: se comprueban los visibles sobre esta ejecución.
  const flags: string[] = pipeline ? ['ci.run', `ci.run.${pipeline.job}`] : ['ide.run']
  if (pipeline) {
    if (pipeline.build === 'SUCCESS' && pipeline.failed > 0) flags.push('ci.false-green')
    if (pipeline.build === 'FAILURE') flags.push('ci.red')
    if (pipeline.build === 'SUCCESS' && pipeline.failed === 0 && pipeline.scenarios > 0) flags.push(`ci.green.${pipeline.job}`)
  }
  const newRetos: string[] = []
  if (scenarios.length > 0 && result.failed === 0 && result.errors === 0) flags.push('ide.green')
  // «Verde» a efectos de entorno: lo que falla, falla solo por bugs reales.
  const green = scenarios.length > 0 && result.errors === 0 && scenarios.every((sc) => sc.status === 'passed' || sc.revealed.length > 0)
  if (green && env.id) flags.push(`ide.green.${env.id}`)
  // Secretos pegados en el código (valores de las propiedades del entorno).
  const secrets = (model.envs ?? []).flatMap((e) => Object.values(e.properties ?? {})).filter((v) => v.length >= 6)
  if (secrets.some((v) => Object.values(files).some((c) => c.includes(v)))) flags.push('smell.hardcoded-secret')
  if (result.errors === 0) {
    for (const r of visibleRetos(mission, state)) {
      if (r.check(scenarios, state.flags, { env: env.id, files, green, pipeline: ctxPipeline })) {
        flags.push(`reto.${r.id}`)
        if (!state.flags[`reto.${r.id}`]) newRetos.push(r.id)
      }
    }
  }
  for (const sc of scenarios) for (const smell of sc.smells) if (!flags.includes(`smell.${smell}`)) flags.push(`smell.${smell}`)
  if (duplicatedScenarios(scenarios)) flags.push('smell.duplicated')

  const next: IdeState = {
    files,
    runs: prev.runs + 1,
    pipeline: ctxPipeline && pipeline ? { runs: pipeline.run, streaks: { ...(prev.pipeline?.streaks ?? {}), [pipeline.job]: ctxPipeline.streak }, last: pipeline } : prev.pipeline,
    last: {
      passed: result.passed,
      failed: result.failed,
      errors: result.errors,
      at: state.clock,
      scenarios: scenarios.map((s) => ({ file: s.file, name: s.name, line: s.outline?.line ?? s.line, status: s.status, error: s.error ? { line: s.error.line, message: firstLine(s.error.message) } : undefined })),
      syntax: result.features.filter((f) => f.error).map((f) => ({ file: f.file, ...f.error! })),
    },
  }
  if (events.length === 0) {
    events.push({
      app: IDE_APP,
      action: 'empty',
      summary: tr(lang, 'Ejecución sin escenarios', 'Run with no scenarios'),
      technical: '[karate] no scenarios found',
      status: 'ok',
      bugs: [],
      cost: model.runCost,
    })
  }
  const lastEvent = events[events.length - 1]
  lastEvent.state = next
  lastEvent.flags = flags
  return { result, events, next, newRetos, pipeline }
}

/** Explicación de un mal olor del código para el informe. */
export function smellText(s: string, lang: AcademyLang): string {
  const t = (es: string, en: string) => tr(lang, es, en)
  switch (s) {
    case 'no-assertions':
      return t('Escenario sin aserciones: pasa siempre, así que no prueba nada.', 'Scenario without assertions: it always passes, so it tests nothing.')
    case 'hardcoded-url':
      return t('URL completa escrita a mano: usa `url baseUrl` y `path` para cambiar de entorno sin tocar los tests.', 'Hand-written full URL: use `url baseUrl` and `path` so you can switch environments without touching the tests.')
    case 'print-no-match':
      return t('Imprimes la respuesta pero no la compruebas: eso lo tiene que mirar una persona.', 'You print the response but do not check it: a person has to look at it.')
    case 'hardcoded-token':
      return t('Token pegado en el código: caduca y es un secreto. Pídelo en el test (login) o en karate-config.js.', 'Token pasted in the code: it expires and it is a secret. Request it in the test (login) or in karate-config.js.')
    case 'status-only':
      return t('Solo compruebas el código de estado: un 200 con datos erróneos también pasaría.', 'You only check the status code: a 200 with wrong data would pass too.')
    default:
      return s
  }
}

/**
 * ¿Hay tres o más escenarios iguales salvo en los datos (copiar y pegar)?
 * Se comparan los pasos cambiando strings y números por un comodín.
 */
export function duplicatedScenarios(scenarios: ScenarioResult[]): boolean {
  const groups = new Map<string, number>()
  for (const sc of scenarios) {
    if (sc.outline) continue
    const shape = sc.steps
      .filter((st) => !st.background)
      .map((st) => st.text.replace(/'[^']*'|"[^"]*"/g, '_').replace(/\b\d+(\.\d+)?\b/g, '_'))
      .join('\n')
    if (shape.split('\n').length < 3) continue
    groups.set(shape, (groups.get(shape) ?? 0) + 1)
  }
  return Array.from(groups.values()).some((n) => n >= 3)
}

/** Valida la ruta de un fichero nuevo (relativa a la carpeta raíz). Devuelve el error o null. */
export function newFileError(rel: string, existing: string[], lang: AcademyLang): string | null {
  const t = (es: string, en: string) => tr(lang, es, en)
  if (!/^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*)*\.(feature|json|js)$/i.test(rel)) {
    return t('Usa una ruta como openapi/schemas/error.json (letras, números, - y _; termina en .feature, .json o .js).', 'Use a path like openapi/schemas/error.json (letters, digits, - and _; ending in .feature, .json or .js).')
  }
  if (existing.some((p) => p.toLowerCase().endsWith('/' + rel.toLowerCase()) || p.toLowerCase() === rel.toLowerCase())) return t('Ese fichero ya existe.', 'That file already exists.')
  return null
}
