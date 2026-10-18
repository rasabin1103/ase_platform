/**
 * `match` de Karate: igualdad profunda con marcadores difusos.
 *
 * Mensajes de error al estilo de Karate 1.4:
 *   match failed: EQUALS
 *     $.status | not equal (STRING:STRING)
 *     'ACTIVE'
 *     'BLOCKED'
 */
import { Closure, Scope, jsonStringify, truthy, type Interpreter } from './js'

export type MatchOp = '==' | '!=' | 'contains' | '!contains' | 'contains only' | 'contains any' | 'contains deep' | 'contains only deep'

export interface MatchOutcome {
  pass: boolean
  /** Mensaje de Karate cuando falla. */
  message?: string
  /** Marcadores difusos usados en el lado derecho (para los retos). */
  markers: string[]
}

/** Evalúa una expresión JS en el contexto de un marcador (`_` = valor, `$` = padre). */
export type ExprEval = (src: string, bindings: Record<string, unknown>) => unknown

interface Ctx {
  evalExpr: ExprEval
  markers: string[]
}

type Fail = { path: string; reason: string; actual: unknown; expected: unknown }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function typeName(v: unknown): string {
  if (v === null) return 'NULL'
  if (v === undefined) return 'NOTPRESENT'
  if (Array.isArray(v)) return 'LIST'
  if (v instanceof Closure) return 'JS'
  switch (typeof v) {
    case 'string':
      return 'STRING'
    case 'number':
      return 'NUMBER'
    case 'boolean':
      return 'BOOLEAN'
    case 'object':
      return 'MAP'
    default:
      return 'OTHER'
  }
}

export function show(v: unknown): string {
  if (v === undefined) return '#notpresent'
  if (typeof v === 'string') return `'${v}'`
  if (v instanceof Closure) return 'function'
  const s = jsonStringify(v)
  return s.length > 400 ? s.slice(0, 400) + '…' : s
}

function isMarker(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('#')
}

/** Comprueba un marcador difuso. Devuelve null si encaja o el motivo si no. */
function checkMarker(raw: string, actual: unknown, present: boolean, parent: unknown, ctx: Ctx): string | null {
  let m = raw
  let optional = false
  if (m.startsWith('##')) {
    optional = true
    m = m.slice(1)
    if (!present || actual === null) {
      ctx.markers.push(raw)
      return null
    }
  }
  ctx.markers.push(optional ? '##' + m.slice(1) : m)
  // Expresión embebida: #(expr)
  if (m.startsWith('#(') && m.endsWith(')')) return null // se resuelve antes
  // #? expr   |   #number? expr
  const q = m.indexOf('?')
  let base = m
  let predicate: string | undefined
  if (q > 0 && /^#[a-z]*\?/.test(m)) {
    base = m.slice(0, q)
    predicate = m.slice(q + 1).trim()
  }
  const okBase = (): string | null => {
    switch (base) {
      case '#':
        return null
      case '#ignore':
        return null
      case '#null':
        return present && actual === null ? null : 'not null'
      case '#notnull':
        return present && actual !== null ? null : 'is null'
      case '#present':
        return present ? null : 'not present'
      case '#notpresent':
        return present ? 'present' : null
      case '#array':
        return Array.isArray(actual) ? null : 'not an array'
      case '#object':
        return actual && typeof actual === 'object' && !Array.isArray(actual) ? null : 'not an object'
      case '#boolean':
        return typeof actual === 'boolean' ? null : 'not a boolean'
      case '#number':
        return typeof actual === 'number' ? null : 'not a number'
      case '#string':
        return typeof actual === 'string' ? null : 'not a string'
      case '#uuid':
        return typeof actual === 'string' && UUID_RE.test(actual) ? null : 'not a valid #uuid'
    }
    if (base.startsWith('#regex')) {
      const re = base.slice(6).trim()
      if (typeof actual !== 'string') return 'not a string'
      try {
        return new RegExp(`^(?:${re})$`).test(actual) ? null : `regex match failed: ${re}`
      } catch {
        return `invalid regex: ${re}`
      }
    }
    // #[] | #[n] | #[] #string | #[n] #number
    const arr = /^#\[(.*?)\]\s*(.*)$/.exec(base === m ? m : base)
    if (arr) {
      if (!Array.isArray(actual)) return 'not an array'
      const sizeExpr = arr[1].trim()
      if (sizeExpr) {
        let size: unknown
        try {
          size = /^\d+$/.test(sizeExpr) ? Number(sizeExpr) : ctx.evalExpr(sizeExpr, { _: actual.length })
        } catch (e) {
          return `invalid array size: ${(e as Error).message}`
        }
        if (typeof size === 'boolean' ? !size : actual.length !== size) return `array length was ${actual.length}`
      }
      const each = arr[2].trim()
      if (each) {
        for (let i = 0; i < actual.length; i++) {
          const r = checkMarker(each, actual[i], true, actual, ctx)
          if (r) return `[${i}] ${r}`
        }
      }
      return null
    }
    if (base === '#?') return null
    return `unknown marker: ${base}`
  }
  if (m.startsWith('#?')) {
    base = '#?'
    predicate = m.slice(2).trim()
  }
  const r = okBase()
  if (r) return r
  if (predicate) {
    let ok: unknown
    try {
      ok = ctx.evalExpr(predicate, { _: actual, $: parent })
    } catch (e) {
      return `evaluation failed: ${(e as Error).message}`
    }
    if (!truthy(ok)) return `predicate failed: ${predicate}`
  }
  return null
}

function deepEq(actual: unknown, expected: unknown, path: string, present: boolean, parent: unknown, ctx: Ctx, mode: 'eq' | 'containsDeep'): Fail | null {
  if (isMarker(expected)) {
    const r = checkMarker(expected, actual, present, parent, ctx)
    if (!r) return null
    // Sin la clave, el motivo útil es que falta (no que «no es un string»).
    const reason = !present && !expected.startsWith('#notpresent') && !expected.startsWith('#present') ? 'actual value not present (missing key)' : r
    return { path, reason, actual, expected }
  }
  if (!present) return { path, reason: 'actual value not present', actual: undefined, expected }
  if (expected === null || typeof expected !== 'object') {
    if (actual === expected) return null
    if (typeof actual === 'number' && typeof expected === 'number' && Math.abs(actual - expected) < 1e-9) return null
    return { path, reason: `not equal (${typeName(actual)}:${typeName(expected)})`, actual, expected }
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return { path, reason: `data types don't match (${typeName(actual)}:LIST)`, actual, expected }
    if (mode === 'eq' && actual.length !== expected.length) return { path, reason: `actual array length is ${actual.length}, expected ${expected.length}`, actual, expected }
    if (mode === 'containsDeep') {
      for (let j = 0; j < expected.length; j++) {
        const found = actual.some((a) => !deepEq(a, expected[j], `${path}[*]`, true, actual, { ...ctx, markers: [] }, mode))
        if (!found) return { path: `${path}[${j}]`, reason: 'actual array does not contain expected item', actual, expected: expected[j] }
      }
      return null
    }
    for (let i = 0; i < expected.length; i++) {
      const f = deepEq(actual[i], expected[i], `${path}[${i}]`, true, actual, ctx, mode)
      if (f) return f
    }
    return null
  }
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return { path, reason: `data types don't match (${typeName(actual)}:MAP)`, actual, expected }
  const a = actual as Record<string, unknown>
  const e = expected as Record<string, unknown>
  for (const k of Object.keys(e)) {
    const has = Object.prototype.hasOwnProperty.call(a, k)
    const f = deepEq(a[k], e[k], `${path}.${k}`, has, a, ctx, mode)
    if (f) return f
  }
  if (mode === 'eq') {
    const extra = Object.keys(a).filter((k) => !Object.prototype.hasOwnProperty.call(e, k))
    if (extra.length) return { path, reason: `actual has ${extra.length} more key(s) than expected - ${extra.map((k) => `${k}`).join(', ')}`, actual, expected }
  }
  return null
}

function contains(actual: unknown, expected: unknown, path: string, ctx: Ctx, deep: boolean): Fail | null {
  const mode = deep ? 'containsDeep' : 'eq'
  if (typeof actual === 'string' && typeof expected === 'string' && !isMarker(expected)) {
    return actual.includes(expected) ? null : { path, reason: 'not a sub-string', actual, expected }
  }
  if (Array.isArray(actual)) {
    const items = Array.isArray(expected) ? expected : [expected]
    for (let j = 0; j < items.length; j++) {
      const found = actual.some((a) => !deepEq(a, items[j], `${path}[*]`, true, actual, { ...ctx, markers: [] }, mode))
      if (!found) return { path, reason: `actual array does not contain expected item - ${show(items[j])}`, actual, expected: items[j] }
    }
    // Registrar marcadores del lado esperado.
    items.forEach((it) => collectMarkers(it, ctx.markers))
    return null
  }
  if (actual && typeof actual === 'object' && expected && typeof expected === 'object' && !Array.isArray(expected)) {
    const a = actual as Record<string, unknown>
    for (const [k, v] of Object.entries(expected as Record<string, unknown>)) {
      const has = Object.prototype.hasOwnProperty.call(a, k)
      const f = deep ? (has || isMarker(v) ? containsDeepValue(a[k], v, `${path}.${k}`, has, a, ctx) : { path: `${path}.${k}`, reason: 'actual value not present', actual: undefined, expected: v }) : deepEq(a[k], v, `${path}.${k}`, has, a, ctx, 'eq')
      if (f) return f
    }
    return null
  }
  return { path, reason: `data types don't match (${typeName(actual)}:${typeName(expected)})`, actual, expected }
}

function containsDeepValue(actual: unknown, expected: unknown, path: string, present: boolean, parent: unknown, ctx: Ctx): Fail | null {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && actual && typeof actual === 'object' && !Array.isArray(actual)) {
    return contains(actual, expected, path, ctx, true)
  }
  return deepEq(actual, expected, path, present, parent, ctx, 'containsDeep')
}

export function collectMarkers(v: unknown, out: string[]) {
  if (isMarker(v)) out.push(v.startsWith('##') ? v : v.split(/[\s?]/)[0])
  else if (Array.isArray(v)) v.forEach((x) => collectMarkers(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectMarkers(x, out))
}

const OP_NAME: Record<MatchOp, string> = {
  '==': 'EQUALS',
  '!=': 'NOT_EQUALS',
  contains: 'CONTAINS',
  '!contains': 'NOT_CONTAINS',
  'contains only': 'CONTAINS_ONLY',
  'contains any': 'CONTAINS_ANY',
  'contains deep': 'CONTAINS_DEEP',
  'contains only deep': 'CONTAINS_ONLY_DEEP',
}

function fmt(op: MatchOp, f: Fail, each?: number): string {
  const head = `match failed: ${each !== undefined ? 'EACH_' : ''}${OP_NAME[op]}`
  const path = each !== undefined ? f.path.replace(/^\$/, `$[${each}]`) : f.path
  return `${head}\n  ${path} | ${f.reason}\n  ${show(f.actual)}\n  ${show(f.expected)}`
}

function one(op: MatchOp, actual: unknown, expected: unknown, ctx: Ctx): Fail | null {
  switch (op) {
    case '==':
      return deepEq(actual, expected, '$', actual !== undefined, undefined, ctx, 'eq')
    case '!=': {
      const f = deepEq(actual, expected, '$', actual !== undefined, undefined, { ...ctx, markers: [] }, 'eq')
      collectMarkers(expected, ctx.markers)
      return f ? null : { path: '$', reason: 'all key-values matched', actual, expected }
    }
    case 'contains':
      return contains(actual, expected, '$', ctx, false)
    case 'contains deep':
      return contains(actual, expected, '$', ctx, true)
    case '!contains': {
      const f = contains(actual, expected, '$', { ...ctx, markers: [] }, false)
      collectMarkers(expected, ctx.markers)
      return f ? null : { path: '$', reason: 'actual contains expected', actual, expected }
    }
    case 'contains only':
    case 'contains only deep': {
      if (!Array.isArray(actual)) return { path: '$', reason: `data types don't match (${typeName(actual)}:LIST)`, actual, expected }
      const items = Array.isArray(expected) ? expected : [expected]
      if (actual.length !== items.length) return { path: '$', reason: `actual array length is ${actual.length}, expected ${items.length}`, actual, expected }
      return contains(actual, items, '$', ctx, op === 'contains only deep')
    }
    case 'contains any': {
      if (!Array.isArray(actual)) return { path: '$', reason: `data types don't match (${typeName(actual)}:LIST)`, actual, expected }
      const items = Array.isArray(expected) ? expected : [expected]
      collectMarkers(expected, ctx.markers)
      const any = items.some((it) => actual.some((a) => !deepEq(a, it, '$', true, actual, { ...ctx, markers: [] }, 'eq')))
      return any ? null : { path: '$', reason: 'actual array does not contain any of the expected items', actual, expected }
    }
  }
}

export function runMatch(op: MatchOp, actual: unknown, expected: unknown, evalExpr: ExprEval, each = false): MatchOutcome {
  const ctx: Ctx = { evalExpr, markers: [] }
  if (each) {
    if (!Array.isArray(actual)) {
      return { pass: false, markers: [], message: `match each failed, expected a list, but was: ${typeName(actual)}\n  ${show(actual)}` }
    }
    for (let i = 0; i < actual.length; i++) {
      const f = one(op, actual[i], expected, ctx)
      if (f) return { pass: false, markers: dedupe(ctx.markers), message: fmt(op, f, i) }
    }
    if (actual.length === 0) collectMarkers(expected, ctx.markers)
    return { pass: true, markers: dedupe(ctx.markers) }
  }
  const f = one(op, actual, expected, ctx)
  return f ? { pass: false, markers: dedupe(ctx.markers), message: fmt(op, f) } : { pass: true, markers: dedupe(ctx.markers) }
}

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs))
}

/**
 * Sustituye las expresiones embebidas `#(expr)` y `##(expr)` de un valor
 * (como hace Karate en `def`, `request` y el lado derecho de `match`).
 */
export function resolveEmbedded(v: unknown, interp: Interpreter, scope: Scope, depth = 0): unknown {
  if (depth > 50) return v
  if (typeof v === 'string') {
    const m = /^(##?)\((.*)\)$/s.exec(v)
    if (!m) return v
    return interp.evalExpression(m[2], scope)
  }
  if (Array.isArray(v)) return v.map((x) => resolveEmbedded(x, interp, scope, depth + 1))
  if (v && typeof v === 'object' && !(v instanceof Closure)) {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v)) {
      const optional = typeof x === 'string' && x.startsWith('##(')
      const r = resolveEmbedded(x, interp, scope, depth + 1)
      if (optional && (r === null || r === undefined)) continue
      out[k] = r
    }
    return out
  }
  return v
}
