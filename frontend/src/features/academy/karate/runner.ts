/**
 * Ejecutor de features de Karate contra una API simulada.
 *
 * Reproduce el comportamiento de Karate 1.4 en lo que cubre el curso:
 * el Background se ejecuta antes de cada escenario, `path`, `param`,
 * `header` y `request` se reinician tras cada `method`, un paso que falla
 * salta el resto del escenario y los esquemas generan un escenario por fila.
 */
import { Closure, Interpreter, JsError, Scope, host, jsonStringify, toPlain, toStr } from './js'
import { resolveEmbedded, runMatch, type MatchOp } from './match'
import { ParseError, parseFeature, type FeatureDef, type ScenarioDef, type Step } from './parser'
import type { HttpHandler, HttpRequest, HttpResponse, ServerFactory } from './http'

export type StepStatus = 'passed' | 'failed' | 'skipped'

export interface StepResult {
  keyword: string
  text: string
  line: number
  status: StepStatus
  error?: string
  background?: boolean
}

export interface RequestRecord {
  n: number
  line: number
  method: string
  url: string
  path: string
  query: Record<string, string[]>
  headers: Record<string, string>
  body?: unknown
  status: number
  responseBody: unknown
  ms: number
  bugs: string[]
}

export interface MatchRecord {
  line: number
  text: string
  op: MatchOp
  each: boolean
  /** Texto del lado izquierdo tal como se escribió. */
  lhs: string
  /** El lado izquierdo es la respuesta entera (`response` o `$`). */
  wholeResponse: boolean
  /** Lado derecho: objeto, lista, marcador suelto o valor. */
  rhsKind: 'object' | 'array' | 'marker' | 'value'
  /** Claves del objeto esperado (si es un objeto). */
  rhsKeys: string[]
  markers: string[]
  /** El lado derecho venía de una variable definida con `def`. */
  rhsFromVar?: string
  pass: boolean
}

export interface DefRecord {
  line: number
  name: string
  kind: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'function' | 'other'
  /** Marcadores difusos dentro del valor (esquemas reutilizables). */
  markers: number
  background: boolean
}

/** Petición que recibió un mock de Karate (karate.start) durante un escenario. */
export interface MockCall {
  port: number
  file: string
  method: string
  path: string
  body?: unknown
  status: number
  /** responseDelay del mock (ms). */
  delay: number
  /** Escenario del mock que respondió (su condición); null si ninguno coincidió. */
  scenario: string | null
}

export type Smell = 'no-assertions' | 'hardcoded-url' | 'print-no-match' | 'status-only' | 'hardcoded-token'

export interface ScenarioResult {
  file: string
  feature: string
  name: string
  line: number
  tags: string[]
  outline?: { row: number; line: number; values: Record<string, string> }
  status: 'passed' | 'failed'
  steps: StepResult[]
  requests: RequestRecord[]
  matches: MatchRecord[]
  defs: DefRecord[]
  statusChecks: number[]
  asserts: number
  prints: number
  error?: { line: number; message: string }
  logs: string[]
  smells: Smell[]
  ms: number
  /** Bugs sembrados que este escenario revela (falla por ellos). */
  revealed: string[]
  /** Peticiones que recibieron los mocks arrancados con karate.start. */
  mockCalls: MockCall[]
}

export interface FeatureResult {
  file: string
  name: string
  error?: { line: number; message: string }
  scenarios: ScenarioResult[]
}

export interface RunResult {
  features: FeatureResult[]
  passed: number
  failed: number
  /** Ficheros con errores de sintaxis. */
  errors: number
  ms: number
  /** Duración real de la ejecución (con hilos en paralelo, la del hilo más lento). */
  wallMs?: number
}

export interface RunOptions {
  files: Record<string, string>
  /** Variables globales (lo que devolvería karate-config.js). */
  config: Record<string, unknown>
  env?: string
  /** Solo los escenarios con alguno de estos tags (sin @). `~tag` excluye. */
  tags?: string[]
  /** Solo este fichero. */
  only?: string
  /** Solo los features bajo esta carpeta (Runner.path). */
  root?: string
  /**
   * Contenido de karate-config.js. Si se indica, se ejecuta antes de cada
   * escenario (como en Karate) y lo que devuelve son las variables globales.
   */
  configSource?: string
  /** Propiedades del sistema (-Dclave=valor): karate.properties. */
  properties?: Record<string, string>
  /**
   * Tags como los de Runner.tags(…) de Karate: cada grupo se cumple si el
   * escenario tiene alguno de sus tags (o no tiene un ~tag); todos los grupos
   * a la vez. Sin @.
   */
  tagGroups?: string[][]
  /** Ejecución en paralelo (Runner.parallel(n)): hilos y semilla del orden. */
  parallel?: { threads: number; seed: number }
}

const KEYWORDS = ['url', 'path', 'param', 'params', 'header', 'headers', 'request', 'method', 'status', 'match', 'def', 'assert', 'print', 'configure', 'eval', 'text', 'json', 'retry', 'set', 'copy', 'remove', 'call', 'callonce']

class StepFailure extends Error {}
/** karate.abort(): termina el escenario sin fallo. */
class AbortScenario extends Error {}

const MATCH_OPS: MatchOp[] = ['contains only deep', 'contains only', 'contains any', 'contains deep', '!contains', 'contains', '==', '!=']

/** Separa «lhs OP rhs» respetando comillas y paréntesis. */
export function splitMatch(text: string): { lhs: string; op: MatchOp; rhs: string } | null {
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    if (depth !== 0) continue
    for (const op of MATCH_OPS) {
      const word = /[a-z]/.test(op[op.length - 1])
      if (!text.startsWith(op, i)) continue
      if (word) {
        const before = i === 0 ? ' ' : text[i - 1]
        const after = text[i + op.length] ?? ' '
        if (!/\s/.test(before) || !/\s/.test(after)) continue
      } else if (op === '==' || op === '!=') {
        if (text[i + 2] === '=') continue
      }
      return { lhs: text.slice(0, i).trim(), op, rhs: text.slice(i + op.length).trim() }
    }
  }
  return null
}

/** JSONPath reducido: $, .key, ['key'], [n], [*], ..key */
export function jsonPath(root: unknown, path: string): unknown {
  const p = path.trim()
  if (!p.startsWith('$')) throw new JsError(`ruta JSON no válida: ${path}`)
  let nodes: unknown[] = [root]
  let multi = false
  let i = 1
  while (i < p.length) {
    if (p.startsWith('..', i)) {
      i += 2
      const m = /^[A-Za-z_$][\w$]*/.exec(p.slice(i))
      if (!m) throw new JsError(`ruta JSON no válida: ${path}`)
      i += m[0].length
      const out: unknown[] = []
      const walk = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(walk)
        else if (v && typeof v === 'object') {
          for (const [k, x] of Object.entries(v)) {
            if (k === m[0]) out.push(x)
            walk(x)
          }
        }
      }
      nodes.forEach(walk)
      nodes = out
      multi = true
      continue
    }
    if (p[i] === '.') {
      i++
      if (p[i] === '*') {
        i++
        nodes = nodes.flatMap((v) => (v && typeof v === 'object' ? Object.values(v) : []))
        multi = true
        continue
      }
      const m = /^[A-Za-z_$][\w$-]*/.exec(p.slice(i))
      if (!m) throw new JsError(`ruta JSON no válida: ${path}`)
      i += m[0].length
      nodes = nodes.map((v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>)[m[0]] : undefined))
      continue
    }
    if (p[i] === '[') {
      const end = p.indexOf(']', i)
      if (end < 0) throw new JsError(`ruta JSON no válida: ${path}`)
      const inner = p.slice(i + 1, end).trim()
      i = end + 1
      if (inner === '*') {
        nodes = nodes.flatMap((v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []))
        multi = true
      } else if (/^-?\d+$/.test(inner)) {
        const n = Number(inner)
        nodes = nodes.map((v) => (Array.isArray(v) ? v[n < 0 ? v.length + n : n] : undefined))
      } else if (/^'.*'$|^".*"$/.test(inner)) {
        const k = inner.slice(1, -1)
        nodes = nodes.map((v) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined))
      } else throw new JsError(`filtro JSONPath no soportado: [${inner}]`)
      continue
    }
    throw new JsError(`ruta JSON no válida: ${path}`)
  }
  if (multi) return nodes.filter((v) => v !== undefined)
  return nodes[0]
}

function kindOf(v: unknown): DefRecord['kind'] {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (v instanceof Closure) return 'function'
  switch (typeof v) {
    case 'object':
      return 'object'
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'other'
  }
}

function countMarkers(v: unknown): number {
  if (typeof v === 'string') return v.startsWith('#') && !v.startsWith('#(') ? 1 : 0
  if (Array.isArray(v)) return v.reduce((n: number, x) => n + countMarkers(x), 0)
  if (v && typeof v === 'object') return Object.values(v).reduce((n: number, x) => n + countMarkers(x), 0)
  return 0
}

function pretty(v: unknown): string {
  if (typeof v === 'string') return v
  try {
    return jsonStringify(v, 2)
  } catch {
    return toStr(v)
  }
}

function dirOf(file: string): string {
  const i = file.lastIndexOf('/')
  return i < 0 ? '' : file.slice(0, i + 1)
}

/** Marca de un feature leído con read() (para call/callonce). */
const FEATURE_REF = '__karateFeature'

interface CallOutcome {
  vars: Record<string, unknown>
  /** Cabeceras configuradas por el llamado (undefined si no las tocó). */
  headers: Record<string, unknown> | Closure | null | undefined
}

/** Caché de callonce: una por servidor (ejecución), para no mezclar datos entre ejecuciones. */
const CALL_ONCE = new WeakMap<HttpHandler, Map<string, CallOutcome>>()
function callOnceCache(handler: HttpHandler): Map<string, CallOutcome> {
  let m = CALL_ONCE.get(handler)
  if (!m) {
    m = new Map()
    CALL_ONCE.set(handler, m)
  }
  return m
}

/** Reloj simulado de una ejecución (ms): avanza con cada respuesta y con las esperas de retry. */
const CLOCKS = new WeakMap<HttpHandler, { now: number }>()
function clockOf(handler: HttpHandler): { now: number } {
  let c = CLOCKS.get(handler)
  if (!c) {
    c = { now: 0 }
    CLOCKS.set(handler, c)
  }
  return c
}

/** Valores por defecto de Karate para retry until. */
const DEFAULT_RETRY = { count: 3, interval: 3000 }

/** Separa «read('x.feature') { a: 1 }» en objetivo y argumentos. */
export function splitCall(rest: string): { target: string; args: string } {
  const t = rest.trim()
  let i = 0
  let depth = 0
  let quote: string | null = null
  for (; i < t.length; i++) {
    const c = t[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"') quote = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && /\s/.test(c)) break
  }
  return { target: t.slice(0, i), args: t.slice(i).trim() }
}

/** Estado de un escenario en ejecución. */
class ScenarioRun {
  readonly interp = new Interpreter()
  readonly scope: Scope
  /** Profundidad de llamadas (call dentro de call). */
  depth = 0
  url = ''
  paths: string[] = []
  params: Record<string, string[]> = {}
  headers: Record<string, string> = {}
  configuredHeaders: Record<string, unknown> | Closure | null = null
  /** Cabeceras quitadas con «header X = null» (también las configuradas). */
  removedHeaders = new Set<string>()
  /** Error de karate-config.js (falla el escenario antes del primer paso). */
  configError: string | null = null
  aborted = false
  body: unknown = undefined
  requestN = 0
  /** Condición de «retry until» para la siguiente petición. */
  retryUntil: string | null = null
  retryConfig = { ...DEFAULT_RETRY }
  /** Ejecución de un mock: response, responseStatus… se pueden definir con def. */
  mock = false
  /** Reloj del hilo que ejecuta este escenario (compartido en ejecución secuencial). */
  clock: { now: number }
  readonly result: ScenarioResult
  readonly file: string
  readonly handler: HttpHandler
  readonly opts: RunOptions

  constructor(
    file: string,
    feature: FeatureDef,
    def: ScenarioDef,
    handler: HttpHandler,
    opts: RunOptions,
    row?: OutlineRow,
  ) {
    this.file = file
    this.handler = handler
    this.opts = opts
    this.clock = clockOf(handler)
    this.result = {
      file,
      feature: feature.name,
      name: row ? substitute(def.name, row.values) : def.name,
      line: def.line,
      tags: [...feature.tags, ...def.tags],
      outline: row ? { row: row.index, line: row.line, values: row.values } : undefined,
      status: 'passed',
      steps: [],
      requests: [],
      matches: [],
      defs: [],
      statusChecks: [],
      asserts: 0,
      prints: 0,
      logs: [],
      smells: [],
      ms: 0,
      revealed: [],
      mockCalls: [],
    }
    const base = new Scope(this.interp.globals)
    for (const [k, v] of Object.entries(opts.config)) base.declare(k, toPlain(v))
    this.scope = new Scope(base)
    this.installKarate(base)
    if (opts.configSource !== undefined) this.runConfig(base, opts.configSource)
    if (row) {
      for (const [k, v] of Object.entries(row.values)) {
        if (k.endsWith('!')) {
          try {
            this.scope.declare(k.slice(0, -1), this.interp.evalExpression(v === '' ? 'null' : v, this.scope))
          } catch {
            this.scope.declare(k.slice(0, -1), v)
          }
        } else this.scope.declare(k, v)
      }
      // Examples dinámicos: cada clave con su tipo (número, objeto…), como en Karate.
      if (row.typed) for (const [k, v] of Object.entries(row.typed)) this.scope.declare(k, toPlain(v))
      this.scope.declare('__row', row.typed ? toPlain(row.typed) : { ...row.values })
      this.scope.declare('__num', row.index)
    }
  }

  /** Ejecuta karate-config.js: una función que devuelve el objeto de configuración. */
  private runConfig(base: Scope, source: string) {
    try {
      const fn = this.interp.evalExpression(`(${source.trim().replace(/;\s*$/, '')})`, base)
      if (!(fn instanceof Closure)) throw new JsError('karate-config.js debe contener una función: function fn() { … return config; }')
      const config = this.interp.call(fn, [])
      if (config === null || config === undefined) return
      if (typeof config !== 'object' || Array.isArray(config)) throw new JsError('karate-config.js debe devolver un objeto (return config)')
      for (const [k, v] of Object.entries(config as Record<string, unknown>)) base.declare(k, v instanceof Closure ? v : toPlain(v))
    } catch (e) {
      this.configError = `karate-config.js: ${(e as Error).message}`
    }
  }

  private installKarate(base: Scope) {
    base.declare(
      'karate',
      {
        env: this.opts.env ?? null,
        properties: { ...(this.opts.properties ?? {}) },
        configure: host((key: unknown, value: unknown) => {
          const k = toStr(key)
          if (k === 'headers') this.configuredHeaders = value instanceof Closure ? value : (toPlain(value) as Record<string, unknown> | null)
          else if (k === 'retry') this.setRetry(toPlain(value))
          return undefined
        }),
        abort: host(() => {
          throw new AbortScenario('karate.abort()')
        }),
        log: host((...args: unknown[]) => {
          this.result.logs.push(`[karate.log] ${args.map(pretty).join(' ')}`)
          return undefined
        }),
        get: host((name: unknown, dflt?: unknown) => {
          const slot = this.scope.lookup(toStr(name))
          return slot ? slot.v : dflt === undefined ? null : dflt
        }),
        set: host((name: unknown, value: unknown) => {
          this.scope.declare(toStr(name), value)
          return undefined
        }),
        jsonPath: host((obj: unknown, path: unknown) => jsonPath(obj, toStr(path))),
        sizeOf: host((v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0)),
        keysOf: host((v: unknown) => (v && typeof v === 'object' ? Object.keys(v) : [])),
        typeOf: host((v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'list' : v instanceof Closure ? 'function' : typeof v === 'object' ? 'map' : typeof v)),
        filter: host((list: unknown, fn: unknown) => (Array.isArray(list) ? list.filter((x, i) => !!this.interp.call(fn, [x, i])) : [])),
        map: host((list: unknown, fn: unknown) => (Array.isArray(list) ? list.map((x, i) => this.interp.call(fn, [x, i])) : [])),
        forEach: host((list: unknown, fn: unknown) => {
          if (Array.isArray(list)) list.forEach((x, i) => this.interp.call(fn, [x, i]))
          return undefined
        }),
        pretty: host((v: unknown) => pretty(v)),
        merge: host((...objs: unknown[]) => Object.assign({}, ...objs.filter((o) => o && typeof o === 'object').map((o) => toPlain(o) as object))),
        toString: host((v: unknown) => toStr(v)),
        lowerCase: host((v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v)),
        fail: host((msg: unknown) => {
          throw new StepFailure(toStr(msg))
        }),
        start: host((arg: unknown) => this.startMock(toPlain(arg))),
        callSingle: host((p: unknown, arg?: unknown) => this.callSingle(toStr(p), toPlain(arg))),
        match: host((actual: unknown, expected: unknown) => {
          const r = runMatch('==', toPlain(actual), toPlain(expected), (src, b) => this.evalWith(src, b))
          return { pass: r.pass, message: r.message ?? null }
        }),
      },
      true,
    )
    base.declare(
      'read',
      host((p: unknown) => this.read(toStr(p))),
      true,
    )
  }

  private read(p: string): unknown {
    // read('login.feature@tag'): llamar solo a los escenarios con ese tag.
    const at = /^(.*\.feature)@([\w-]+)$/.exec(p)
    const tag = at?.[2]
    const name = (at ? at[1] : p).replace(/^classpath:/, '').replace(/^this:/, '')
    const candidates = [dirOf(this.file) + name, name, ...Object.keys(this.opts.files).filter((f) => f.endsWith('/' + name))]
    const found = candidates.find((c) => this.opts.files[c] !== undefined)
    if (!found) throw new StepFailure(`no se encuentra el fichero: ${p}`)
    const content = this.opts.files[found]
    if (found.endsWith('.json')) {
      try {
        return this.interp.evalExpression(`(${content})`, this.scope)
      } catch (e) {
        throw new StepFailure(`${found}: JSON no válido (${(e as Error).message})`)
      }
    }
    if (found.endsWith('.js')) return this.interp.evalExpression(`(${content.trim().replace(/;$/, '')})`, this.scope)
    if (found.endsWith('.feature')) return { [FEATURE_REF]: found, tag: tag ?? null }
    return content
  }

  /**
   * call / callonce. «rest» es lo que sigue a la palabra clave: el objetivo
   * (read('x.feature'), una variable o una función) y, opcionalmente, los
   * argumentos. Con shared (paso suelto «* call …») las variables y las
   * cabeceras configuradas del llamado pasan al que llama.
   */
  private call(rest: string, once: boolean, shared: boolean): unknown {
    const { target, args } = splitCall(rest)
    const ref = this.evalKarate(target)
    const argValue = args ? this.evalKarate(args) : undefined
    if (argValue !== undefined && argValue !== null && (typeof argValue !== 'object' || Array.isArray(argValue))) {
      throw new StepFailure('call: los argumentos tienen que ser un objeto JSON (p. ej. { scope: \'accounts:read\' })')
    }
    const argObj = (argValue ?? {}) as Record<string, unknown>
    if (ref instanceof Closure) {
      // callonce de una función: se ejecuta una vez por feature (p. ej. arrancar un mock).
      if (!once) return this.interp.call(ref, args ? [argValue] : [])
      const cache = callOnceCache(this.handler)
      const key = `${this.file}|fn:${target}|${jsonStringify(argObj)}`
      const hit = cache.get(key)
      if (hit) {
        this.log(`[callonce] ${target}: resultado en caché (no se vuelve a ejecutar)`)
        return hit.vars.__value
      }
      const value = this.interp.call(ref, args ? [argValue] : [])
      cache.set(key, { vars: { __value: value }, headers: undefined })
      return value
    }
    if (!ref || typeof ref !== 'object' || !(FEATURE_REF in (ref as object))) {
      throw new StepFailure('call: se esperaba read(\'algo.feature\') o una función')
    }
    const path = (ref as Record<string, unknown>)[FEATURE_REF] as string
    const tag = (ref as Record<string, unknown>).tag as string | null
    const cache = once ? callOnceCache(this.handler) : null
    const key = `${this.file}|${path}@${tag ?? ''}|${jsonStringify(argObj)}`
    let outcome = cache?.get(key)
    if (outcome) this.log(`[callonce] ${path}: resultado en caché (no se vuelve a ejecutar)`)
    else {
      outcome = this.runCalled(path, tag, argObj)
      cache?.set(key, outcome)
    }
    if (shared) {
      for (const [k, v] of Object.entries(outcome.vars)) this.scope.declare(k, v)
      if (outcome.headers !== undefined) this.configuredHeaders = outcome.headers
    }
    return { ...outcome.vars }
  }

  private runCalled(path: string, tag: string | null, args: Record<string, unknown>, opts: RunOptions = this.opts): CallOutcome {
    if (this.depth >= 5) throw new StepFailure('call: demasiadas llamadas anidadas (¿un feature que se llama a sí mismo?)')
    let feature: FeatureDef
    try {
      feature = parseFeature(this.opts.files[path])
    } catch (e) {
      throw new StepFailure(`call ${path}: ${(e as Error).message}${e instanceof ParseError ? ` (línea ${e.line})` : ''}`)
    }
    const items = expandScenarios(feature, path, this.opts).filter((it) => !tag || [...feature.tags, ...it.def.tags].includes(tag))
    if (items.length === 0) throw new StepFailure(`call ${path}: no hay escenarios${tag ? ` con @${tag}` : ''}`)
    const callerVars = this.scope.own()
    let outcome: CallOutcome = { vars: {}, headers: undefined }
    this.log(`[call] ${path}${tag ? '@' + tag : ''}${Object.keys(args).length ? ' ' + jsonStringify(args) : ''}`)
    for (const item of items) {
      const run = new ScenarioRun(path, feature, item.def, this.handler, opts, item.row)
      run.depth = this.depth + 1
      run.requestN = this.requestN
      run.configuredHeaders = this.configuredHeaders
      run.retryConfig = { ...this.retryConfig }
      run.clock = this.clock
      // Como en Karate: el llamado ve las variables del que llama y los argumentos.
      for (const [k, v] of Object.entries(callerVars)) run.scope.declare(k, v)
      for (const [k, v] of Object.entries(args)) run.scope.declare(k, toPlain(v))
      run.scope.declare('__arg', toPlain(args))
      const steps = [
        ...(feature.background?.steps ?? []).map((step) => ({ step, background: true })),
        ...item.def.steps.map((step) => ({ step, background: false })),
      ]
      run.run(steps, item.row?.values)
      this.requestN = run.requestN
      this.result.requests.push(...run.result.requests)
      this.result.mockCalls.push(...run.result.mockCalls)
      this.result.ms += run.result.ms
      for (const l of run.result.logs) this.log(`  ${l}`)
      if (run.result.status === 'failed') {
        const err = run.result.error
        throw new StepFailure(`call ${path}:${err?.line ?? ''} falló\n${err?.message ?? ''}`)
      }
      const vars: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(run.scope.own())) {
        if (k === '__arg') continue
        if (k in callerVars && callerVars[k] === v) continue
        vars[k] = v
      }
      outcome = { vars, headers: run.configuredHeaders !== this.configuredHeaders ? run.configuredHeaders : undefined }
    }
    return outcome
  }

  evalWith(src: string, bindings: Record<string, unknown>): unknown {
    const s = new Scope(this.scope)
    for (const [k, v] of Object.entries(bindings)) s.declare(k, v)
    return this.interp.evalExpression(src, s)
  }

  /** Evalúa una expresión al estilo de Karate (JSONPath con $, JS en el resto). */
  evalKarate(src: string, docString?: string): unknown {
    const text = docString !== undefined && src.trim() === '' ? docString : src
    const t = text.trim()
    if (t === '') throw new StepFailure('falta el valor')
    const callExpr = /^(call|callonce)\s+(.+)$/s.exec(t)
    if (callExpr) return this.call(callExpr[2], callExpr[1] === 'callonce', false)
    if (t.startsWith('$')) {
      if (t === '$' || /^\$[.[]/.test(t)) {
        const resp = this.scope.lookup('response')
        if (!resp) throw new StepFailure('todavía no hay respuesta: «$» se refiere a la última respuesta (falta «method»)')
        return jsonPath(resp.v, t)
      }
    }
    // Un objeto o una función sueltos serían un bloque o una declaración: se
    // envuelven en paréntesis para leerlos como expresión.
    const v = this.interp.runProgram(/^(?:[{[]|function\b)/.test(t) ? `(${t})` : t, this.scope)
    return resolveEmbedded(toPlain(v), this.interp, this.scope)
  }

  log(line: string) {
    this.result.logs.push(line)
  }

  run(steps: { step: Step; background: boolean }[], values?: Record<string, string>) {
    for (const _ of this.iterate(steps, values)) void _
  }

  /** Ejecuta los pasos uno a uno (cede el control tras cada paso: hilos en paralelo). */
  *iterate(steps: { step: Step; background: boolean }[], values?: Record<string, string>): Generator<void, void, void> {
    let failed = false
    if (this.configError) {
      const examples = this.configError.startsWith('Examples')
      const line = examples ? this.result.line : 1
      this.result.steps.push({ keyword: '*', text: examples ? 'Examples' : 'karate-config.js', line, status: 'failed', error: this.configError, background: !examples })
      this.result.status = 'failed'
      this.result.error = { line, message: this.configError }
      failed = true
    }
    for (const { step, background } of steps) {
      const text = values ? substitute(step.text, values) : step.text
      const doc = values && step.docString !== undefined ? substitute(step.docString, values) : step.docString
      const sr: StepResult = { keyword: step.keyword, text, line: step.line, status: 'skipped', background }
      this.result.steps.push(sr)
      if (failed || this.aborted) continue
      try {
        this.exec(text, doc, step, background)
        sr.status = 'passed'
      } catch (e) {
        if (e instanceof AbortScenario) {
          sr.status = 'passed'
          this.aborted = true
          this.log('[karate.abort] escenario terminado sin ejecutar el resto de pasos')
          continue
        }
        const msg = e instanceof StepFailure || e instanceof JsError ? e.message : e instanceof Error ? e.message : String(e)
        sr.status = 'failed'
        sr.error = msg
        this.result.status = 'failed'
        this.result.error = { line: step.line, message: msg }
        failed = true
      }
      yield
    }
  }

  private exec(text: string, doc: string | undefined, step: Step, background: boolean) {
    const m = /^([A-Za-z]+)\b\s*(.*)$/s.exec(text)
    const kw = m?.[1] ?? ''
    const rest = (m?.[2] ?? '').trim()
    if (!KEYWORDS.includes(kw)) {
      // Asignación JavaScript como paso: «* cats[id] = cat», «* data.total = 0».
      if (/^[A-Za-z_$][\w$]*\s*(\.|\[)[^=]*[^=!<>]=(?!=)/.test(text)) {
        const root = /^[A-Za-z_$][\w$]*/.exec(text)![0]
        if (!this.scope.lookup(root)) throw new StepFailure(`la variable «${root}» no existe (créala antes con def)`)
        this.interp.runProgram(text, this.scope)
        return
      }
      if (/^[A-Za-z_$][\w$.]*\s*\(/.test(text) || text.startsWith('karate.')) {
        this.interp.runProgram(text, this.scope)
        return
      }
      throw new StepFailure(`no step-definition method match found for: ${text}`)
    }
    switch (kw) {
      case 'url': {
        const v = this.evalKarate(rest, doc)
        if (typeof v !== 'string') throw new StepFailure(`url: se esperaba un string y llegó ${jsonStringify(v)}`)
        this.url = v
        this.paths = []
        if (!background && /^https?:\/\//.test(rest.replace(/^['"]/, ''))) this.flag('hardcoded-url')
        return
      }
      case 'path': {
        if (!rest) throw new StepFailure('path: falta el valor')
        const list = this.interp.evalExpression(`[${rest}]`, this.scope) as unknown[]
        for (const seg of list) {
          if (seg === null || seg === undefined) throw new StepFailure('path: un segmento es null')
          const s = toStr(seg)
          if (/^https?:\/\//.test(s)) this.flag('hardcoded-url')
          this.paths.push(s)
        }
        return
      }
      case 'param': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('param: usa «param nombre = valor»')
        const name = rest.slice(0, eq).trim()
        const v = this.evalKarate(rest.slice(eq + 1))
        this.params[name] = Array.isArray(v) ? v.map(toStr) : [toStr(v)]
        return
      }
      case 'params': {
        const v = this.evalKarate(rest, doc)
        if (!v || typeof v !== 'object') throw new StepFailure('params: se esperaba un objeto JSON')
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (x !== null && x !== undefined) this.params[k] = Array.isArray(x) ? x.map(toStr) : [toStr(x)]
        return
      }
      case 'header': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('header: usa «header Nombre = valor»')
        const name = rest.slice(0, eq).trim()
        // Un token copiado de la consola caduca: se pide en el test (login) o en karate-config.js.
        if (name.toLowerCase() === 'authorization' && /^\s*['"]Bearer\s+\S{8,}['"]\s*$/.test(rest.slice(eq + 1))) this.flag('hardcoded-token')
        const v = this.evalKarate(rest.slice(eq + 1))
        if (v === null || v === undefined) {
          // Como en Karate: un valor null quita la cabecera.
          delete this.headers[name]
          this.removedHeaders.add(name.toLowerCase())
        } else this.headers[name] = toStr(v)
        return
      }
      case 'headers': {
        const v = this.evalKarate(rest, doc)
        if (!v || typeof v !== 'object') throw new StepFailure('headers: se esperaba un objeto JSON')
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (x !== null && x !== undefined) this.headers[k] = toStr(x)
        return
      }
      case 'request':
        this.body = this.evalKarate(rest, doc)
        return
      case 'text':
      case 'json': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure(`${kw}: usa «${kw} nombre =» con un docstring`)
        const name = rest.slice(0, eq).trim()
        const raw = rest.slice(eq + 1).trim() || doc || ''
        this.scope.declare(name, kw === 'text' ? raw : this.evalKarate(raw))
        return
      }
      case 'method':
        return this.request(rest, step.line)
      case 'status': {
        if (!/^\d{3}$/.test(rest)) throw new StepFailure('status: se esperaba un código de 3 cifras (p. ej. «status 200»)')
        const expected = Number(rest)
        this.result.statusChecks.push(expected)
        const st = this.scope.lookup('responseStatus')
        if (!st) throw new StepFailure('status: todavía no hay respuesta (falta «method» antes)')
        if (st.v !== expected) {
          const last = this.result.requests[this.result.requests.length - 1]
          throw new StepFailure(
            `status code was: ${String(st.v)}, expected: ${expected}, response time in milliseconds: ${last?.ms ?? 0}, url: ${last?.url ?? ''}, response: \n${pretty(this.scope.lookup('response')?.v)}`,
          )
        }
        return
      }
      case 'match':
        return this.match(rest, doc, step.line, text)
      case 'def': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('def: usa «def nombre = valor»')
        const name = rest.slice(0, eq).trim()
        if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new StepFailure(`def: nombre de variable no válido «${name}»`)
        const reserved = this.mock ? ['karate', 'read'] : ['response', 'responseStatus', 'responseHeaders', 'karate', 'read']
        if (reserved.includes(name)) throw new StepFailure(`def: «${name}» es una variable reservada de Karate`)
        const v = this.evalKarate(rest.slice(eq + 1), doc)
        this.scope.declare(name, v)
        this.result.defs.push({ line: step.line, name, kind: kindOf(v), markers: countMarkers(v), background })
        return
      }
      case 'set': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('set: usa «set variable.campo = valor»')
        const target = rest.slice(0, eq).trim()
        const root = /^[A-Za-z_$][\w$]*/.exec(target)?.[0]
        if (!root || !this.scope.lookup(root)) throw new StepFailure(`set: la variable «${root ?? target}» no existe (créala antes con def)`)
        const v = this.evalKarate(rest.slice(eq + 1), doc)
        const s = new Scope(this.scope)
        s.declare('__karate_value', v)
        this.interp.runProgram(`${target.startsWith('$') ? 'response' + target.slice(1) : target} = __karate_value`, s)
        return
      }
      case 'copy': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('copy: usa «copy nueva = existente»')
        const name = rest.slice(0, eq).trim()
        const v = this.evalKarate(rest.slice(eq + 1))
        this.scope.declare(name, JSON.parse(jsonStringify(v)))
        return
      }
      case 'remove': {
        const target = rest.trim()
        if (!/^[A-Za-z_$][\w$]*[.[]/.test(target)) throw new StepFailure('remove: usa «remove variable.campo»')
        this.interp.runProgram(`delete ${target}`, this.scope)
        return
      }
      case 'assert': {
        this.result.asserts++
        const v = this.evalKarate(rest)
        if (!v) throw new StepFailure(`did not evaluate to 'true': ${rest}`)
        return
      }
      case 'print': {
        this.result.prints++
        const list = this.interp.evalExpression(`[${rest}]`, this.scope) as unknown[]
        this.log(`[print] ${list.map((x) => pretty(toPlain(x))).join(' ')}`)
        return
      }
      case 'eval':
        this.interp.runProgram(rest || doc || '', this.scope)
        return
      case 'configure': {
        const eq = rest.indexOf('=')
        if (eq < 0) throw new StepFailure('configure: usa «configure clave = valor»')
        const key = rest.slice(0, eq).trim()
        const raw = rest.slice(eq + 1).trim()
        const v0 = raw ? this.interp.runProgram(/^[{[]/.test(raw) ? `(${raw})` : raw, this.scope) : this.evalKarate('', doc)
        const v = v0 instanceof Closure ? v0 : resolveEmbedded(toPlain(v0), this.interp, this.scope)
        if (key === 'headers') this.configuredHeaders = v instanceof Closure ? v : (v as Record<string, unknown> | null)
        else if (key === 'retry') this.setRetry(v)
        else if (!['ssl', 'readTimeout', 'connectTimeout', 'logPrettyRequest', 'logPrettyResponse', 'report', 'cookies', 'charset'].includes(key)) throw new StepFailure(`configure: clave no soportada «${key}»`)
        return
      }
      case 'call':
      case 'callonce':
        if (!rest) throw new StepFailure(`${kw}: falta qué llamar (p. ej. ${kw} read('login.feature'))`)
        this.call(rest, kw === 'callonce', true)
        return
      case 'retry': {
        const cond = /^until\s+(.+)$/s.exec(rest)
        if (!cond) throw new StepFailure('retry: usa «retry until condición» antes de «method»')
        this.retryUntil = cond[1].trim()
        return
      }
    }
  }

  /** configure retry = { count, interval }: se mezcla con los valores por defecto. */
  private setRetry(v: unknown) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new StepFailure('configure retry: se esperaba un objeto { count: 3, interval: 3000 }')
    const o = v as Record<string, unknown>
    for (const k of Object.keys(o)) if (k !== 'count' && k !== 'interval') throw new StepFailure(`configure retry: clave no soportada «${k}» (usa count e interval)`)
    const count = o.count === undefined ? this.retryConfig.count : o.count
    const interval = o.interval === undefined ? this.retryConfig.interval : o.interval
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 100) throw new StepFailure('configure retry: count debe ser un entero entre 1 y 100')
    if (typeof interval !== 'number' || interval < 0 || interval > 60000) throw new StepFailure('configure retry: interval son milisegundos (entre 0 y 60000)')
    this.retryConfig = { count, interval }
  }

  private flag(smell: Smell) {
    if (!this.result.smells.includes(smell)) this.result.smells.push(smell)
  }

  private request(methodName: string, line: number) {
    const method = methodName.trim().toUpperCase()
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) throw new StepFailure(`method: método HTTP no válido «${methodName}» (usa get, post, put, patch o delete)`)
    if (!this.url) throw new StepFailure('url not set, please refer to the keyword documentation for \'url\'')
    let full = this.url.replace(/\/+$/, '')
    for (const seg of this.paths) full += '/' + seg.replace(/^\/+/, '').split('/').map((p) => encodeURIComponent(decodeURIComponentSafe(p))).join('/')
    const m = /^(https?):\/\/([^/?#]+)(\/[^?#]*)?(\?[^#]*)?$/.exec(full)
    if (!m) throw new StepFailure(`url no válida: ${full}`)
    const query: Record<string, string[]> = {}
    if (m[4]) {
      for (const part of m[4].slice(1).split('&')) {
        if (!part) continue
        const [k, v = ''] = part.split('=')
        ;(query[decodeURIComponentSafe(k)] ??= []).push(decodeURIComponentSafe(v))
      }
    }
    for (const [k, v] of Object.entries(this.params)) query[k] = [...(query[k] ?? []), ...v]
    const headers: Record<string, string> = {}
    if (this.configuredHeaders) {
      const ch = this.configuredHeaders instanceof Closure ? this.interp.call(this.configuredHeaders, []) : this.configuredHeaders
      if (ch && typeof ch === 'object') for (const [k, v] of Object.entries(ch as Record<string, unknown>)) if (v !== null && v !== undefined) headers[k] = toStr(v)
    }
    Object.assign(headers, this.headers)
    for (const h of Object.keys(headers)) if (this.removedHeaders.has(h.toLowerCase())) delete headers[h]
    if (this.body !== undefined && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json; charset=UTF-8'
    const req: HttpRequest = { method, url: `${m[1]}://${m[2]}${m[3] ?? ''}`, host: m[2], path: m[3] ?? '/', query, headers, body: this.body }
    const qs = Object.entries(query).flatMap(([k, vs]) => vs.map((v) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)).join('&')
    const shown = req.url + (qs ? `?${qs}` : '')
    const until = this.retryUntil
    this.retryUntil = null
    // Como en Karate: path, params, headers y request se reinician tras cada llamada.
    const reset = () => {
      this.paths = []
      this.params = {}
      this.headers = {}
      this.removedHeaders = new Set()
      this.body = undefined
    }
    const clock = this.clock
    const { count, interval } = this.retryConfig
    for (let attempt = 1; ; attempt++) {
      this.send(req, shown, line)
      if (until === null) break
      let ok = false
      try {
        ok = !!this.interp.evalExpression(until, this.scope)
      } catch (e) {
        this.log(`[retry] la condición dio error: ${(e as Error).message}`)
      }
      if (ok) break
      this.log(`[retry] retry condition not satisfied: ${until}`)
      if (attempt >= count) {
        reset()
        throw new StepFailure(`too many retry attempts: ${count}\ncondición: ${until}\núltima respuesta (${String(this.scope.lookup('responseStatus')?.v)}): \n${pretty(this.scope.lookup('response')?.v)}`)
      }
      this.log(`[retry] sleeping before retry #${attempt} (${interval} ms)`)
      clock.now += interval
      this.result.ms += interval
    }
    reset()
  }

  /**
   * Entrega una petición: a un mock arrancado en ese puerto de localhost o,
   * si no, a la API simulada. Las llamadas salientes de la API (net) pasan
   * también por aquí.
   */
  dispatch(req: HttpRequest, indent = ''): HttpResponse {
    const local = /^(localhost|127\.0\.0\.1)(?::(\d+))?$/.exec(req.host)
    const mock = local ? mocksOf(this.handler).get(Number(local[2] ?? 80)) : undefined
    if (!mock) {
      const res = this.handler(req)
      if (indent && res.status === 0) this.log(`${indent}[red] ${req.method} ${req.url} ! ${String(res.body)}`)
      return res
    }
    const res = mock.handle(req, (line) => this.log(`${indent}${line}`))
    this.result.mockCalls.push(res.call)
    return res.response
  }

  /**
   * karate.callSingle('classpath:x.feature', arg): una sola vez en toda la
   * ejecución (todos los features y todos los hilos). Sin karate-config.js en
   * el llamado: lo que necesite le llega en arg.
   */
  private callSingle(p: string, arg: unknown): unknown {
    const path = this.resolve(p.replace(/^classpath:/, ''))
    if (!path || !path.endsWith('.feature')) throw new StepFailure(`karate.callSingle: no se encuentra ${p}`)
    const args = arg && typeof arg === 'object' && !Array.isArray(arg) ? (arg as Record<string, unknown>) : {}
    const cache = callOnceCache(this.handler)
    const key = `single|${path}|${jsonStringify(args)}`
    const hit = cache.get(key)
    if (hit) {
      this.log(`[callSingle] ${path}: resultado en caché (una vez por ejecución)`)
      return { ...hit.vars }
    }
    const outcome = this.runCalled(path, null, args, { ...this.opts, configSource: undefined })
    cache.set(key, outcome)
    return { ...outcome.vars }
  }

  /** karate.start('mock.feature') o karate.start({ mock: 'mock.feature', port: 8090 }). */
  private startMock(arg: unknown): Record<string, unknown> {
    const o = typeof arg === 'string' ? { mock: arg } : arg && typeof arg === 'object' ? (arg as Record<string, unknown>) : null
    if (!o || typeof o.mock !== 'string') throw new StepFailure("karate.start: usa karate.start('mock.feature') o karate.start({ mock: 'mock.feature', port: 8090 })")
    const path = this.resolve(o.mock)
    if (!path || !path.endsWith('.feature')) throw new StepFailure(`karate.start: no se encuentra el mock ${o.mock}`)
    const mocks = mocksOf(this.handler)
    let port: number
    if (o.port !== undefined) {
      if (typeof o.port !== 'number' || !Number.isInteger(o.port) || o.port < 1 || o.port > 65535) throw new StepFailure('karate.start: port debe ser un número de puerto')
      port = o.port
      if (mocks.has(port)) throw new StepFailure(`java.net.BindException: Address already in use (puerto ${port}: ya hay un mock arrancado ahí; arráncalo una sola vez con callonce)`)
    } else {
      port = 50100
      while (mocks.has(port)) port++
    }
    let feature: FeatureDef
    try {
      feature = parseFeature(this.opts.files[path])
    } catch (e) {
      throw new StepFailure(`karate.start ${path}: ${(e as Error).message}${e instanceof ParseError ? ` (línea ${e.line})` : ''}`)
    }
    const run = new ScenarioRun(path, feature, { kind: 'scenario', name: 'mock', line: feature.line, tags: [], steps: [] }, this.handler, this.opts)
    run.mock = true
    run.depth = this.depth + 1
    run.run((feature.background?.steps ?? []).map((step) => ({ step, background: true })))
    for (const l of run.result.logs) this.log(`[mock :${port}] ${l}`)
    if (run.result.status === 'failed') throw new StepFailure(`karate.start ${path}: el Background del mock falló\n${run.result.error?.message ?? ''}`)
    mocks.set(port, new MockServer(path, port, feature, run))
    this.log(`[mock] ${path} arrancado en http://localhost:${port}`)
    return { port, url: `http://localhost:${port}` }
  }

  /** Ruta de un fichero del proyecto (relativa al feature actual o con classpath:). */
  private resolve(p: string): string | undefined {
    const name = p.replace(/^classpath:/, '').replace(/^this:/, '')
    return [dirOf(this.file) + name, name, ...Object.keys(this.opts.files).filter((f) => f.endsWith('/' + name))].find((c) => this.opts.files[c] !== undefined)
  }

  /** Una petición HTTP: log, respuesta y variables response*. */
  private send(req: HttpRequest, shown: string, line: number) {
    const clock = this.clock
    const n = ++this.requestN
    this.log(`${n} > ${req.method} ${shown}`)
    for (const [k, v] of Object.entries(req.headers)) this.log(`${n} > ${k}: ${v}`)
    if (req.body !== undefined) this.log(pretty(req.body))
    const res = this.dispatch({ ...req, now: clock.now, net: (out) => this.dispatch({ ...out, now: clock.now }, '  ') })
    clock.now += res.ms
    this.result.ms += res.ms
    if (res.status === 0) {
      this.log(`${n} ! ${String(res.body)}`)
      throw new StepFailure(`${String(res.body)}`)
    }
    this.log(`${n} < ${res.status} (${res.ms} ms)`)
    for (const [k, v] of Object.entries(res.headers)) this.log(`${n} < ${k}: ${v}`)
    if (res.body !== undefined && res.body !== '') this.log(pretty(res.body))
    this.result.requests.push({
      n,
      line,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      headers: req.headers,
      body: req.body,
      status: res.status,
      responseBody: res.body,
      ms: res.ms,
      bugs: res.bugs ?? [],
    })
    this.scope.declare('response', toPlain(res.body))
    this.scope.declare('responseStatus', res.status)
    this.scope.declare('responseHeaders', Object.fromEntries(Object.entries(res.headers).map(([k, v]) => [k, [v]])))
    this.scope.declare('responseTime', res.ms)
  }

  private match(rest: string, doc: string | undefined, line: number, text: string) {
    let each = false
    let body = rest
    if (/^each\s/.test(body)) {
      each = true
      body = body.slice(5).trim()
    }
    const parts = splitMatch(body)
    if (!parts) throw new StepFailure('match: no encuentro el operador (==, !=, contains…)')
    const { lhs, op } = parts
    let rhsSrc = parts.rhs
    if (!lhs) throw new StepFailure('match: falta el lado izquierdo')
    const actual = this.evalKarate(lhs)
    if (rhsSrc === '' && doc === undefined) throw new StepFailure('match: falta el valor esperado')
    let rhsFromVar: string | undefined
    if (/^[A-Za-z_$][\w$]*$/.test(rhsSrc) && this.scope.lookup(rhsSrc) && !['true', 'false', 'null'].includes(rhsSrc)) rhsFromVar = rhsSrc
    if (rhsSrc === '' && doc !== undefined) rhsSrc = ''
    const expected = this.evalKarate(rhsSrc, doc)
    const outcome = runMatch(op, actual, expected, (src, b) => this.evalWith(src, b), each)
    const isMarkerStr = typeof expected === 'string' && expected.startsWith('#')
    this.result.matches.push({
      line,
      text,
      op,
      each,
      lhs,
      wholeResponse: lhs === 'response' || lhs === '$',
      rhsKind: Array.isArray(expected) ? 'array' : expected && typeof expected === 'object' ? 'object' : isMarkerStr ? 'marker' : 'value',
      rhsKeys: expected && typeof expected === 'object' && !Array.isArray(expected) ? Object.keys(expected) : [],
      // Marcadores del lado esperado (aunque el match se pare en el primer fallo).
      markers: Array.from(new Set([...outcome.markers, ...staticMarkers(expected)])),
      rhsFromVar,
      pass: outcome.pass,
    })
    if (!outcome.pass) throw new StepFailure(outcome.message ?? 'match failed')
  }

  finish() {
    const assertive = this.result.statusChecks.length + this.result.matches.length + this.result.asserts
    const stepsHave = (kw: string) => this.result.steps.some((s) => s.text.startsWith(kw + ' ') || s.text === kw)
    const hasAssertSteps = stepsHave('status') || stepsHave('match') || stepsHave('assert')
    if (assertive === 0 && !hasAssertSteps) this.flag('no-assertions')
    if (this.result.prints > 0 && this.result.matches.length === 0 && !stepsHave('match')) this.flag('print-no-match')
    if (this.result.statusChecks.length > 0 && this.result.matches.length === 0 && this.result.asserts === 0 && !stepsHave('match') && !stepsHave('assert')) this.flag('status-only')
    this.result.ms += 5
  }
}

/** Mocks arrancados con karate.start en una ejecución (puerto → mock). */
const MOCKS = new WeakMap<HttpHandler, Map<number, MockServer>>()
function mocksOf(handler: HttpHandler): Map<number, MockServer> {
  let m = MOCKS.get(handler)
  if (!m) {
    m = new Map()
    MOCKS.set(handler, m)
  }
  return m
}

/**
 * Mock de Karate: un feature cuyos escenarios son condiciones sobre la
 * petición (pathMatches, methodIs…). El primero que se cumple responde con
 * response, responseStatus, responseHeaders y responseDelay. Las variables
 * del Background son globales y los escenarios pueden cambiarlas (estado).
 */
class MockServer {
  readonly file: string
  readonly port: number
  readonly feature: FeatureDef
  readonly run: ScenarioRun

  constructor(file: string, port: number, feature: FeatureDef, run: ScenarioRun) {
    this.file = file
    this.port = port
    this.feature = feature
    this.run = run
  }

  handle(req: HttpRequest, log: (line: string) => void): { response: HttpResponse; call: MockCall } {
    const run = this.run
    const scope = run.scope
    let pathParams: Record<string, string> = {}
    const headerOf = (name: string) => Object.entries(req.headers).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1]
    scope.declare('request', req.body === undefined ? null : toPlain(req.body))
    scope.declare('requestMethod', req.method.toUpperCase())
    scope.declare('requestPath', req.path)
    scope.declare('requestUri', req.path.replace(/^\//, ''))
    scope.declare('requestHeaders', Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, [v]])))
    scope.declare('requestParams', toPlain(req.query))
    scope.declare('pathParams', {})
    scope.declare(
      'pathMatches',
      host((pattern: unknown) => {
        const names: string[] = []
        const re = new RegExp('^' + toStr(pattern).replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{([^}/]+)\}/g, (_a, n: string) => (names.push(n), '([^/]+)')) + '/?$')
        const m = re.exec(req.path)
        if (!m) return false
        pathParams = Object.fromEntries(names.map((n, i) => [n, decodeURIComponentSafe(m[i + 1])]))
        scope.declare('pathParams', pathParams)
        return true
      }),
    )
    scope.declare('methodIs', host((m: unknown) => toStr(m).toUpperCase() === req.method.toUpperCase()))
    scope.declare('paramValue', host((n: unknown) => req.query[toStr(n)]?.[0] ?? null))
    scope.declare('paramExists', host((n: unknown) => toStr(n) in req.query))
    scope.declare('headerContains', host((n: unknown, v: unknown) => (headerOf(toStr(n)) ?? '').includes(toStr(v))))
    scope.declare('typeContains', host((v: unknown) => (headerOf('content-type') ?? '').includes(toStr(v))))
    scope.declare('acceptContains', host((v: unknown) => (headerOf('accept') ?? '').includes(toStr(v))))
    scope.declare('bodyPath', host((p: unknown) => jsonPath(toPlain(req.body ?? null), toStr(p))))
    scope.declare('response', null)
    scope.declare('responseStatus', 200)
    scope.declare('responseHeaders', {})
    scope.declare('responseDelay', 0)

    const firstLog = run.result.logs.length
    let matched: ScenarioDef | null = null
    for (const sc of this.feature.scenarios) {
      const cond = sc.name.trim()
      if (cond === '') {
        matched = sc
        break
      }
      try {
        if (run.interp.evalExpression(cond, scope)) {
          matched = sc
          break
        }
      } catch (e) {
        run.log(`[mock] la condición «${cond}» dio error: ${(e as Error).message}`)
      }
    }
    let status = 404
    let body: unknown = null
    let headers: Record<string, string> = {}
    let delay = 0
    if (matched) {
      const before = run.result.steps.length
      run.result.status = 'passed'
      run.result.error = undefined
      run.aborted = false
      run.run(matched.steps.map((step) => ({ step, background: false })))
      const failedStep = run.result.steps.slice(before).find((st) => st.status === 'failed')
      if (failedStep) {
        status = 500
        body = { error: `mock ${this.file}:${failedStep.line}: ${failedStep.error ?? 'falló'}` }
      } else {
        const st = scope.lookup('responseStatus')?.v
        status = typeof st === 'number' ? st : Number(st) || 200
        body = toPlain(scope.lookup('response')?.v ?? null)
        const rh = toPlain(scope.lookup('responseHeaders')?.v)
        if (rh && typeof rh === 'object') headers = Object.fromEntries(Object.entries(rh as Record<string, unknown>).map(([k, v]) => [k, toStr(Array.isArray(v) ? v[0] : v)]))
        const d = scope.lookup('responseDelay')?.v
        delay = typeof d === 'number' && d > 0 ? Math.min(d, 60000) : 0
      }
    }
    log(`[mock :${this.port}] < ${req.method} ${req.path}${req.body !== undefined ? ' ' + jsonStringify(toPlain(req.body)) : ''}`)
    for (const l of run.result.logs.slice(firstLog)) log(`[mock :${this.port}] ${l}`)
    const label = matched ? matched.name.trim() || '(catch-all)' : null
    log(`[mock :${this.port}] ${req.method} ${req.path} → ${status}${delay ? ` (responseDelay ${delay} ms)` : ''}${label ? ` · Scenario: ${label}` : ' · ningún escenario coincide'}`)
    const response: HttpResponse = {
      status,
      headers: { ...(body !== null && typeof body === 'object' ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body,
      ms: delay + 2,
    }
    return { response, call: { port: this.port, file: this.file, method: req.method, path: req.path, body: req.body, status, delay, scenario: label } }
  }
}

function staticMarkers(v: unknown): string[] {
  const out: string[] = []
  const walk = (x: unknown) => {
    if (typeof x === 'string' && x.startsWith('#') && !x.startsWith('#(') && !x.startsWith('##(')) out.push(x)
    else if (Array.isArray(x)) x.forEach(walk)
    else if (x && typeof x === 'object' && !(x instanceof Closure)) Object.values(x).forEach(walk)
  }
  walk(v)
  return out
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function substitute(text: string, values: Record<string, string>): string {
  return text.replace(/<([^<>\s]+)>/g, (all, name: string) => (name in values ? values[name] : name + '!' in values ? values[name + '!'] : all))
}

/** Escenarios concretos de un feature (los esquemas se expanden por fila). */
/** Fila de un esquema: textos para sustituir <col> y, en Examples dinámicos, valores con su tipo. */
export interface OutlineRow {
  index: number
  line: number
  values: Record<string, string>
  typed?: Record<string, unknown>
}

export interface ScenarioItem {
  def: ScenarioDef
  row?: OutlineRow
  /** Error al calcular las filas de unos Examples dinámicos. */
  error?: string
}

/** Evalúa la expresión de unos Examples dinámicos (p. ej. read('datos.json')). */
function dynamicRows(expr: string, file: string, feature: FeatureDef, def: ScenarioDef, opts: RunOptions): Record<string, unknown>[] {
  const noHttp: HttpHandler = () => {
    throw new StepFailure('no se pueden hacer peticiones al calcular los Examples')
  }
  const run = new ScenarioRun(file, feature, { ...def, kind: 'scenario', steps: [] }, noHttp, opts)
  const v = run.evalKarate(expr)
  if (!Array.isArray(v)) throw new JsError(`Examples dinámicos: «${expr}» debe devolver una lista de objetos`)
  return v.map((x, i) => {
    if (!x || typeof x !== 'object' || Array.isArray(x)) throw new JsError(`Examples dinámicos: el elemento ${i} no es un objeto`)
    return x as Record<string, unknown>
  })
}

/** Escenarios concretos de un feature (los esquemas se expanden por fila). */
export function expandScenarios(feature: FeatureDef, file = '', opts?: RunOptions): ScenarioItem[] {
  const out: ScenarioItem[] = []
  for (const def of feature.scenarios) {
    if (def.kind === 'scenario') {
      out.push({ def })
      continue
    }
    let index = 0
    for (const ex of def.examples ?? []) {
      if (ex.rows.length === 0 && ex.header.length === 1) {
        const expr = ex.header[0]
        let rows: Record<string, unknown>[]
        try {
          if (!opts) throw new JsError('Examples dinámicos sin contexto de ejecución')
          rows = dynamicRows(expr, file, feature, def, opts)
        } catch (e) {
          out.push({ def, row: { index: index++, line: def.line, values: {} }, error: `Examples: ${(e as Error).message}` })
          continue
        }
        for (const typed of rows) {
          const values: Record<string, string> = {}
          for (const [k, v] of Object.entries(typed)) values[k] = typeof v === 'string' ? v : jsonStringify(v)
          out.push({ def: { ...def, tags: [...def.tags, ...ex.tags] }, row: { index: index++, line: def.line, values, typed } })
        }
        continue
      }
      for (const r of ex.rows) {
        const values: Record<string, string> = {}
        ex.header.forEach((h, i) => (values[h] = r.cells[i] ?? ''))
        out.push({ def: { ...def, tags: [...def.tags, ...ex.tags] }, row: { index: index++, line: r.line, values } })
      }
    }
  }
  return out
}

function tagFilter(tags: string[], filter?: string[], groups?: string[][]): boolean {
  if (tags.includes('ignore')) return false
  if (groups && !groups.every((g) => g.length === 0 || g.some((t) => (t.startsWith('~') ? !tags.includes(t.slice(1)) : tags.includes(t))))) return false
  if (!filter || filter.length === 0) return true
  const include = filter.filter((t) => !t.startsWith('~'))
  const exclude = filter.filter((t) => t.startsWith('~')).map((t) => t.slice(1))
  if (exclude.some((t) => tags.includes(t))) return false
  return include.length === 0 || include.some((t) => tags.includes(t))
}

function prepare(file: string, feature: FeatureDef, item: ScenarioItem, handler: HttpHandler, opts: RunOptions) {
  const run = new ScenarioRun(file, feature, item.def, handler, opts, item.row)
  if (item.error) run.configError = item.error
  const steps = [
    ...(feature.background?.steps ?? []).map((step) => ({ step, background: true })),
    ...item.def.steps.map((step) => ({ step, background: false })),
  ]
  return { run, steps }
}

export function runScenario(file: string, feature: FeatureDef, item: ScenarioItem, handler: HttpHandler, opts: RunOptions): ScenarioResult {
  const { run, steps } = prepare(file, feature, item, handler, opts)
  run.run(steps, item.row?.values)
  run.finish()
  return run.result
}

/** Números pseudoaleatorios deterministas (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Runner.parallel(n): los escenarios se reparten entre n hilos que avanzan a
 * la vez sobre la misma API (paso a paso, por orden de su reloj). El reparto y
 * el arranque de cada hilo dependen de la semilla: como en un pipeline real,
 * el orden cambia de una ejecución a otra.
 */
function runParallel(opts: RunOptions, handler: HttpHandler, work: { file: string; feature: FeatureDef; item: ScenarioItem; result?: ScenarioResult }[], threads: number, seed: number): number {
  const rand = rng(seed * 7919 + 17)
  const order = work.map((w, i) => ({ w, k: rand(), i })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.w)
  const pool = Array.from({ length: Math.max(1, Math.min(threads, order.length)) }, () => ({
    clock: { now: Math.floor(rand() * 20) },
    current: null as null | { w: (typeof order)[number]; run: ScenarioRun; it: Iterator<void> },
  }))
  let next = 0
  let guard = 0
  for (;;) {
    if (++guard > 200000) throw new Error('ejecución en paralelo: demasiados pasos')
    // Los hilos libres toman el siguiente escenario de la cola.
    for (const t of pool) {
      if (!t.current && next < order.length) {
        const w = order[next++]
        const { run, steps } = prepare(w.file, w.feature, w.item, handler, opts)
        run.clock = t.clock
        run.log(`[hilo ${pool.indexOf(t) + 1}]`)
        t.current = { w, run, it: run.iterate(steps, w.item.row?.values) }
      }
    }
    const busy = pool.filter((t) => t.current)
    if (busy.length === 0) break
    const t = busy.reduce((a, b) => (b.clock.now < a.clock.now ? b : a))
    const before = t.clock.now
    const cur = t.current!
    if (cur.it.next().done) {
      cur.run.finish()
      cur.w.result = cur.run.result
      t.current = null
    } else if (t.clock.now === before) t.clock.now += 1
  }
  return Math.max(...pool.map((t) => t.clock.now))
}

/** Ejecuta todos los .feature del proyecto. */
export function runFeatures(opts: RunOptions, handler: HttpHandler): RunResult {
  if (opts.parallel && opts.parallel.threads > 1) return runFeaturesParallel(opts, handler, opts.parallel)
  const features: FeatureResult[] = []
  const files = Object.keys(opts.files)
    .filter((f) => f.endsWith('.feature') && (!opts.only || f === opts.only) && (!opts.root || f.startsWith(opts.root)))
    .sort()
  for (const file of files) {
    let feature: FeatureDef
    try {
      feature = parseFeature(opts.files[file])
    } catch (e) {
      const line = e instanceof ParseError ? e.line : 1
      features.push({ file, name: file, error: { line, message: (e as Error).message }, scenarios: [] })
      continue
    }
    const fr: FeatureResult = { file, name: feature.name, scenarios: [] }
    for (const item of expandScenarios(feature, file, opts)) {
      if (!tagFilter([...feature.tags, ...item.def.tags], opts.tags, opts.tagGroups)) continue
      fr.scenarios.push(runScenario(file, feature, item, handler, opts))
    }
    features.push(fr)
  }
  const all = features.flatMap((f) => f.scenarios)
  return {
    features,
    passed: all.filter((s) => s.status === 'passed').length,
    failed: all.filter((s) => s.status === 'failed').length,
    errors: features.filter((f) => f.error).length,
    ms: all.reduce((n, s) => n + s.ms, 0),
    wallMs: clockOf(handler).now,
  }
}

function runFeaturesParallel(opts: RunOptions, handler: HttpHandler, p: { threads: number; seed: number }): RunResult {
  const features: FeatureResult[] = []
  const work: { file: string; feature: FeatureDef; item: ScenarioItem; result?: ScenarioResult; fr: FeatureResult }[] = []
  const files = Object.keys(opts.files)
    .filter((f) => f.endsWith('.feature') && (!opts.only || f === opts.only) && (!opts.root || f.startsWith(opts.root)))
    .sort()
  for (const file of files) {
    let feature: FeatureDef
    try {
      feature = parseFeature(opts.files[file])
    } catch (e) {
      const line = e instanceof ParseError ? e.line : 1
      features.push({ file, name: file, error: { line, message: (e as Error).message }, scenarios: [] })
      continue
    }
    const fr: FeatureResult = { file, name: feature.name, scenarios: [] }
    features.push(fr)
    for (const item of expandScenarios(feature, file, opts)) {
      if (!tagFilter([...feature.tags, ...item.def.tags], opts.tags, opts.tagGroups)) continue
      work.push({ file, feature, item, fr })
    }
  }
  const wallMs = runParallel(opts, handler, work, p.threads, p.seed)
  for (const w of work) if (w.result) w.fr.scenarios.push(w.result)
  const all = features.flatMap((f) => f.scenarios)
  return {
    features,
    passed: all.filter((s) => s.status === 'passed').length,
    failed: all.filter((s) => s.status === 'failed').length,
    errors: features.filter((f) => f.error).length,
    ms: all.reduce((n, s) => n + s.ms, 0),
    wallMs,
  }
}

/**
 * Ejecuta el proyecto y averigua qué bugs revela cada escenario que falla:
 * un escenario revela el bug B si falla con la API actual y pasa con la
 * misma API sin B (se repite en limpio, quitando un bug cada vez).
 */
export function runProject(opts: RunOptions, server: ServerFactory, activeBugs: string[]): RunResult {
  const result = runFeatures(opts, server(activeBugs))
  for (const fr of result.features) {
    if (fr.error) continue
    let feature: FeatureDef | null = null
    const items = () => {
      feature ??= parseFeature(opts.files[fr.file])
      return expandScenarios(feature, fr.file, opts)
    }
    for (const sc of fr.scenarios) {
      if (sc.status !== 'failed') continue
      const tainted = Array.from(new Set(sc.requests.flatMap((r) => r.bugs)))
      if (tainted.length === 0) continue
      const item = items().find((it) => it.def.line === sc.line && (it.row?.index ?? -1) === (sc.outline?.row ?? -1))
      if (!item) continue
      for (const bug of tainted) {
        const clean = runScenario(fr.file, feature!, item, server(activeBugs.filter((b) => b !== bug)), opts)
        if (clean.status === 'passed') sc.revealed.push(bug)
      }
      if (sc.revealed.length === 0 && tainted.length > 1) {
        const clean = runScenario(fr.file, feature!, item, server(activeBugs.filter((b) => !tainted.includes(b))), opts)
        if (clean.status === 'passed') sc.revealed.push(...tainted)
      }
    }
  }
  return result
}
