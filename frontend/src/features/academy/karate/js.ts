/**
 * Subconjunto de JavaScript para el intérprete de Karate de ASE Academy.
 *
 * Karate usa JavaScript para `def`, `assert`, `#(…)`, `#? …` y karate-config.js.
 * Aquí se interpreta un subconjunto suficiente para todo eso, sin `eval` ni
 * `new Function`: el código del alumno no puede tocar `window`, la red ni el
 * almacenamiento, y un límite de pasos corta los bucles infinitos.
 *
 * Soporta: literales (números, strings, plantillas, objetos, arrays, null,
 * undefined, true/false), operadores aritméticos, de comparación, lógicos,
 * `??`, `?.`, ternario, `typeof`, asignaciones (también `+=`, `++`),
 * funciones (`function` y flecha), `var/let/const`, `if/else`, `for`,
 * `for…of`, `for…in`, `while`, `return`, `break`, `continue`, y una lista
 * blanca de métodos de string, array, número, Math, JSON y Object.
 */

export class JsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsError'
  }
}

// ------------------------------------------------------------------ Tokens
type TokType = 'num' | 'str' | 'tpl' | 'id' | 'punc' | 'eof'
interface Tok {
  type: TokType
  value: string
  /** Partes de una plantilla: textos y código de las expresiones. */
  parts?: { text: string[]; exprs: string[] }
  pos: number
  /** Hay un salto de línea antes del token (para `return` y ASI). */
  nl: boolean
}

const PUNCS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.',
]

function isIdStart(c: string) {
  return /[A-Za-z_$À-ɏ]/.test(c)
}
function isIdPart(c: string) {
  return /[A-Za-z0-9_$À-ɏ]/.test(c)
}

export function tokenize(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  let nl = false
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === '\n') {
      nl = true
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      if (end < 0) throw new JsError('comentario sin cerrar')
      if (src.slice(i, end).includes('\n')) nl = true
      i = end + 2
      continue
    }
    const start = i
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      while (i < n && /[0-9._eE]/.test(src[i])) {
        if ((src[i] === 'e' || src[i] === 'E') && (src[i + 1] === '-' || src[i + 1] === '+')) i++
        i++
      }
      toks.push({ type: 'num', value: src.slice(start, i).replace(/_/g, ''), pos: start, nl })
      nl = false
      continue
    }
    if (c === '"' || c === "'") {
      i++
      let out = ''
      while (i < n && src[i] !== c) {
        if (src[i] === '\n') throw new JsError('string sin cerrar')
        if (src[i] === '\\') {
          i++
          out += escapeChar(src[i] ?? '')
          i++
          continue
        }
        out += src[i++]
      }
      if (i >= n) throw new JsError('string sin cerrar')
      i++
      toks.push({ type: 'str', value: out, pos: start, nl })
      nl = false
      continue
    }
    if (c === '`') {
      i++
      const text: string[] = []
      const exprs: string[] = []
      let cur = ''
      while (i < n && src[i] !== '`') {
        if (src[i] === '\\') {
          i++
          cur += escapeChar(src[i] ?? '')
          i++
          continue
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          i += 2
          let depth = 1
          const s0 = i
          while (i < n && depth > 0) {
            if (src[i] === '{') depth++
            else if (src[i] === '}') depth--
            if (depth > 0) i++
          }
          if (i >= n) throw new JsError('plantilla sin cerrar')
          text.push(cur)
          cur = ''
          exprs.push(src.slice(s0, i))
          i++
          continue
        }
        cur += src[i++]
      }
      if (i >= n) throw new JsError('plantilla sin cerrar')
      i++
      text.push(cur)
      toks.push({ type: 'tpl', value: '', parts: { text, exprs }, pos: start, nl })
      nl = false
      continue
    }
    if (isIdStart(c)) {
      while (i < n && isIdPart(src[i])) i++
      toks.push({ type: 'id', value: src.slice(start, i), pos: start, nl })
      nl = false
      continue
    }
    const p = PUNCS.find((x) => src.startsWith(x, i))
    if (!p) throw new JsError(`carácter inesperado «${c}»`)
    i += p.length
    toks.push({ type: 'punc', value: p, pos: start, nl })
    nl = false
  }
  toks.push({ type: 'eof', value: '', pos: n, nl })
  return toks
}

function escapeChar(c: string): string {
  switch (c) {
    case 'n':
      return '\n'
    case 't':
      return '\t'
    case 'r':
      return '\r'
    case '0':
      return '\0'
    default:
      return c
  }
}

// --------------------------------------------------------------------- AST
export type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'tpl'; text: string[]; exprs: Node[] }
  | { t: 'lit'; v: boolean | null | undefined }
  | { t: 'id'; name: string }
  | { t: 'arr'; items: (Node | { t: 'spread'; arg: Node })[] }
  | { t: 'obj'; props: ({ key: string | Node; value: Node } | { t: 'spread'; arg: Node })[] }
  | { t: 'mem'; obj: Node; prop: Node | string; computed: boolean; optional: boolean }
  | { t: 'call'; callee: Node; args: (Node | { t: 'spread'; arg: Node })[]; optional: boolean }
  | { t: 'new'; callee: Node; args: Node[] }
  | { t: 'un'; op: string; arg: Node }
  | { t: 'upd'; op: '++' | '--'; prefix: boolean; arg: Node }
  | { t: 'bin'; op: string; l: Node; r: Node }
  | { t: 'log'; op: '&&' | '||' | '??'; l: Node; r: Node }
  | { t: 'cond'; test: Node; yes: Node; no: Node }
  | { t: 'asg'; op: string; target: Node; value: Node }
  | { t: 'fn'; name?: string; params: Param[]; body: Stmt[] | Node; arrow: boolean }
  | { t: 'seq'; items: Node[] }

type Param = { name: string; def?: Node; rest?: boolean }

export type Stmt =
  | { t: 'expr'; e: Node }
  | { t: 'var'; kind: string; decls: { name: string; init?: Node }[] }
  | { t: 'func'; name: string; fn: Node }
  | { t: 'ret'; e?: Node }
  | { t: 'if'; test: Node; yes: Stmt; no?: Stmt }
  | { t: 'block'; body: Stmt[] }
  | { t: 'for'; init?: Stmt; test?: Node; update?: Node; body: Stmt }
  | { t: 'forof'; kind: string; name: string; iter: Node; body: Stmt; of: boolean }
  | { t: 'while'; test: Node; body: Stmt }
  | { t: 'brk' }
  | { t: 'cont' }
  | { t: 'throw'; e: Node }
  | { t: 'empty' }

const BIN_PREC: Record<string, number> = {
  '??': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6,
  '==': 7, '!=': 7, '===': 7, '!==': 7,
  '<': 8, '>': 8, '<=': 8, '>=': 8, in: 8, instanceof: 8,
  '<<': 9, '>>': 9, '>>>': 9,
  '+': 10, '-': 10, '*': 11, '/': 11, '%': 11, '**': 12,
}
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '&&=', '||=', '??='])

class Parser {
  private i = 0
  private readonly toks: Tok[]
  constructor(toks: Tok[]) {
    this.toks = toks
  }

  private peek(o = 0) {
    return this.toks[Math.min(this.i + o, this.toks.length - 1)]
  }
  private next() {
    return this.toks[this.i++]
  }
  private is(value: string, o = 0) {
    const t = this.peek(o)
    return (t.type === 'punc' || t.type === 'id') && t.value === value
  }
  private eat(value: string) {
    if (this.is(value)) {
      this.i++
      return true
    }
    return false
  }
  private expect(value: string) {
    if (!this.eat(value)) {
      const t = this.peek()
      throw new JsError(`se esperaba «${value}» y llegó «${t.type === 'eof' ? 'fin' : t.value || t.type}»`)
    }
  }
  atEnd() {
    return this.peek().type === 'eof'
  }

  program(): Stmt[] {
    const out: Stmt[] = []
    while (!this.atEnd()) out.push(this.statement())
    return out
  }

  private semi() {
    if (this.eat(';')) return
    const t = this.peek()
    if (t.type === 'eof' || t.nl || this.is('}')) return
    throw new JsError(`se esperaba «;» antes de «${t.value}»`)
  }

  statement(): Stmt {
    const t = this.peek()
    if (t.type === 'punc' && t.value === '{') {
      this.next()
      const body: Stmt[] = []
      while (!this.is('}')) {
        if (this.atEnd()) throw new JsError('bloque sin cerrar')
        body.push(this.statement())
      }
      this.next()
      return { t: 'block', body }
    }
    if (t.type === 'punc' && t.value === ';') {
      this.next()
      return { t: 'empty' }
    }
    if (t.type === 'id') {
      switch (t.value) {
        case 'var':
        case 'let':
        case 'const': {
          const s = this.varDecl()
          this.semi()
          return s
        }
        case 'function': {
          if (this.peek(1).type === 'id') {
            const fn = this.functionExpr()
            return { t: 'func', name: (fn as { name?: string }).name!, fn }
          }
          break
        }
        case 'return': {
          this.next()
          const nt = this.peek()
          if (nt.type === 'eof' || nt.nl || this.is(';') || this.is('}')) {
            this.eat(';')
            return { t: 'ret' }
          }
          const e = this.expression()
          this.semi()
          return { t: 'ret', e }
        }
        case 'if': {
          this.next()
          this.expect('(')
          const test = this.expression()
          this.expect(')')
          const yes = this.statement()
          const no = this.eat('else') ? this.statement() : undefined
          return { t: 'if', test, yes, no }
        }
        case 'while': {
          this.next()
          this.expect('(')
          const test = this.expression()
          this.expect(')')
          return { t: 'while', test, body: this.statement() }
        }
        case 'for':
          return this.forStmt()
        case 'break':
          this.next()
          this.semi()
          return { t: 'brk' }
        case 'continue':
          this.next()
          this.semi()
          return { t: 'cont' }
        case 'throw': {
          this.next()
          const e = this.expression()
          this.semi()
          return { t: 'throw', e }
        }
      }
    }
    const e = this.expression()
    this.semi()
    return { t: 'expr', e }
  }

  private varDecl(): Stmt {
    const kind = this.next().value
    const decls: { name: string; init?: Node }[] = []
    do {
      const name = this.ident()
      const init = this.eat('=') ? this.assign() : undefined
      decls.push({ name, init })
    } while (this.eat(','))
    return { t: 'var', kind, decls }
  }

  private forStmt(): Stmt {
    this.next()
    this.expect('(')
    if ((this.is('var') || this.is('let') || this.is('const')) && this.peek(1).type === 'id' && (this.is('of', 2) || this.is('in', 2))) {
      const kind = this.next().value
      const name = this.ident()
      const of = this.next().value === 'of'
      const iter = this.expression()
      this.expect(')')
      return { t: 'forof', kind, name, iter, body: this.statement(), of }
    }
    let init: Stmt | undefined
    if (!this.is(';')) init = this.is('var') || this.is('let') || this.is('const') ? this.varDecl() : { t: 'expr', e: this.expression() }
    this.expect(';')
    const test = this.is(';') ? undefined : this.expression()
    this.expect(';')
    const update = this.is(')') ? undefined : this.expression()
    this.expect(')')
    return { t: 'for', init, test, update, body: this.statement() }
  }

  private ident(): string {
    const t = this.next()
    if (t.type !== 'id') throw new JsError(`se esperaba un nombre y llegó «${t.value}»`)
    return t.value
  }

  expression(): Node {
    const first = this.assign()
    if (!this.is(',')) return first
    const items = [first]
    while (this.eat(',')) items.push(this.assign())
    return { t: 'seq', items }
  }

  private isArrowAhead(): boolean {
    // ident =>   |   ( ... ) =>
    if (this.peek().type === 'id' && this.is('=>', 1)) return true
    if (!this.is('(')) return false
    let depth = 0
    for (let k = this.i; k < this.toks.length; k++) {
      const t = this.toks[k]
      if (t.type === 'punc' && (t.value === '(' || t.value === '[' || t.value === '{')) depth++
      else if (t.type === 'punc' && (t.value === ')' || t.value === ']' || t.value === '}')) {
        depth--
        if (depth === 0) {
          const nx = this.toks[k + 1]
          return !!nx && nx.type === 'punc' && nx.value === '=>'
        }
      } else if (t.type === 'eof') return false
    }
    return false
  }

  private arrow(): Node {
    const params: Param[] = []
    if (this.peek().type === 'id') params.push({ name: this.ident() })
    else params.push(...this.params())
    this.expect('=>')
    if (this.is('{')) return { t: 'fn', params, body: this.block(), arrow: true }
    return { t: 'fn', params, body: this.assign(), arrow: true }
  }

  private params(): Param[] {
    this.expect('(')
    const params: Param[] = []
    while (!this.is(')')) {
      const rest = this.eat('...')
      const name = this.ident()
      const def = this.eat('=') ? this.assign() : undefined
      params.push({ name, def, rest })
      if (!this.eat(',')) break
    }
    this.expect(')')
    return params
  }

  private block(): Stmt[] {
    this.expect('{')
    const body: Stmt[] = []
    while (!this.is('}')) {
      if (this.atEnd()) throw new JsError('función sin cerrar')
      body.push(this.statement())
    }
    this.next()
    return body
  }

  private functionExpr(): Node {
    this.expect('function')
    const name = this.peek().type === 'id' ? this.ident() : undefined
    const params = this.params()
    return { t: 'fn', name, params, body: this.block(), arrow: false }
  }

  assign(): Node {
    if (this.isArrowAhead()) return this.arrow()
    const left = this.conditional()
    const t = this.peek()
    if (t.type === 'punc' && ASSIGN_OPS.has(t.value)) {
      if (left.t !== 'id' && left.t !== 'mem') throw new JsError('asignación a algo que no es una variable')
      this.next()
      return { t: 'asg', op: t.value, target: left, value: this.assign() }
    }
    return left
  }

  private conditional(): Node {
    const test = this.binary(0)
    if (!this.eat('?')) return test
    const yes = this.assign()
    this.expect(':')
    const no = this.assign()
    return { t: 'cond', test, yes, no }
  }

  private binary(minPrec: number): Node {
    let left = this.unary()
    for (;;) {
      const t = this.peek()
      const op = t.value
      if (!((t.type === 'punc' || t.type === 'id') && Object.prototype.hasOwnProperty.call(BIN_PREC, op))) break
      const prec = BIN_PREC[op]
      // Asociatividad por la izquierda: solo entra un operador que liga más.
      if (prec <= minPrec) break
      this.next()
      const right = this.binary(op === '**' ? prec - 1 : prec)
      left = op === '&&' || op === '||' || op === '??' ? { t: 'log', op, l: left, r: right } : { t: 'bin', op, l: left, r: right }
    }
    return left
  }

  private unary(): Node {
    const t = this.peek()
    if (t.type === 'punc' && ['!', '-', '+', '~'].includes(t.value)) {
      this.next()
      return { t: 'un', op: t.value, arg: this.unary() }
    }
    if (t.type === 'punc' && (t.value === '++' || t.value === '--')) {
      this.next()
      return { t: 'upd', op: t.value, prefix: true, arg: this.unary() }
    }
    if (t.type === 'id' && (t.value === 'typeof' || t.value === 'void' || t.value === 'delete')) {
      this.next()
      return { t: 'un', op: t.value, arg: this.unary() }
    }
    return this.postfix()
  }

  private postfix(): Node {
    const e = this.callMember()
    const t = this.peek()
    if (t.type === 'punc' && (t.value === '++' || t.value === '--') && !t.nl) {
      this.next()
      return { t: 'upd', op: t.value, prefix: false, arg: e }
    }
    return e
  }

  private args(): (Node | { t: 'spread'; arg: Node })[] {
    const args: (Node | { t: 'spread'; arg: Node })[] = []
    while (!this.is(')')) {
      if (this.eat('...')) args.push({ t: 'spread', arg: this.assign() })
      else args.push(this.assign())
      if (!this.eat(',')) break
    }
    this.expect(')')
    return args
  }

  private callMember(): Node {
    let e: Node
    if (this.eat('new')) {
      const callee = this.primary()
      const args = this.is('(') ? (this.next(), this.args()) : []
      e = { t: 'new', callee, args: args as Node[] }
    } else e = this.primary()
    for (;;) {
      if (this.eat('.')) {
        const t = this.next()
        if (t.type !== 'id') throw new JsError('se esperaba un nombre de propiedad después de «.»')
        e = { t: 'mem', obj: e, prop: t.value, computed: false, optional: false }
      } else if (this.is('?.')) {
        this.next()
        if (this.eat('(')) e = { t: 'call', callee: e, args: this.args(), optional: true }
        else if (this.eat('[')) {
          const prop = this.expression()
          this.expect(']')
          e = { t: 'mem', obj: e, prop, computed: true, optional: true }
        } else e = { t: 'mem', obj: e, prop: this.ident(), computed: false, optional: true }
      } else if (this.eat('[')) {
        const prop = this.expression()
        this.expect(']')
        e = { t: 'mem', obj: e, prop, computed: true, optional: false }
      } else if (this.eat('(')) {
        e = { t: 'call', callee: e, args: this.args(), optional: false }
      } else if (this.peek().type === 'tpl' && !this.peek().nl) {
        throw new JsError('las plantillas etiquetadas no están soportadas')
      } else break
    }
    return e
  }

  private primary(): Node {
    const t = this.peek()
    switch (t.type) {
      case 'num': {
        this.next()
        const v = Number(t.value)
        if (Number.isNaN(v)) throw new JsError(`número no válido: ${t.value}`)
        return { t: 'num', v }
      }
      case 'str':
        this.next()
        return { t: 'str', v: t.value }
      case 'tpl': {
        this.next()
        const exprs = t.parts!.exprs.map((src) => parseExpression(src))
        return { t: 'tpl', text: t.parts!.text, exprs }
      }
      case 'id': {
        if (t.value === 'function') return this.functionExpr()
        this.next()
        if (t.value === 'true') return { t: 'lit', v: true }
        if (t.value === 'false') return { t: 'lit', v: false }
        if (t.value === 'null') return { t: 'lit', v: null }
        if (t.value === 'undefined') return { t: 'lit', v: undefined }
        return { t: 'id', name: t.value }
      }
      case 'punc': {
        if (t.value === '(') {
          this.next()
          const e = this.expression()
          this.expect(')')
          return e
        }
        if (t.value === '[') {
          this.next()
          const items: (Node | { t: 'spread'; arg: Node })[] = []
          while (!this.is(']')) {
            if (this.eat('...')) items.push({ t: 'spread', arg: this.assign() })
            else items.push(this.assign())
            if (!this.eat(',')) break
          }
          this.expect(']')
          return { t: 'arr', items }
        }
        if (t.value === '{') {
          this.next()
          const props: ({ key: string | Node; value: Node } | { t: 'spread'; arg: Node })[] = []
          while (!this.is('}')) {
            if (this.eat('...')) {
              props.push({ t: 'spread', arg: this.assign() })
            } else {
              const k = this.next()
              let key: string | Node
              if (k.type === 'id' || k.type === 'str') key = k.value
              else if (k.type === 'num') key = String(Number(k.value))
              else if (k.type === 'punc' && k.value === '[') {
                key = this.assign()
                this.expect(']')
              } else throw new JsError(`clave de objeto no válida: «${k.value}»`)
              if (this.eat(':')) props.push({ key, value: this.assign() })
              else if (typeof key === 'string' && k.type === 'id') {
                if (this.is('(')) {
                  const params = this.params()
                  props.push({ key, value: { t: 'fn', name: key, params, body: this.block(), arrow: false } })
                } else props.push({ key, value: { t: 'id', name: key } })
              } else throw new JsError('se esperaba «:» en el objeto')
            }
            if (!this.eat(',')) break
          }
          this.expect('}')
          return { t: 'obj', props }
        }
        break
      }
      case 'eof':
        throw new JsError('expresión incompleta')
    }
    throw new JsError(`símbolo inesperado «${t.value}»`)
  }
}

const exprCache = new Map<string, Node>()
const progCache = new Map<string, Stmt[]>()

export function parseExpression(src: string): Node {
  const hit = exprCache.get(src)
  if (hit) return hit
  const p = new Parser(tokenize(src))
  const e = p.expression()
  if (!p.atEnd()) throw new JsError('sobra código después de la expresión')
  if (exprCache.size > 2000) exprCache.clear()
  exprCache.set(src, e)
  return e
}

export function parseProgram(src: string): Stmt[] {
  const hit = progCache.get(src)
  if (hit) return hit
  const prog = new Parser(tokenize(src)).program()
  if (progCache.size > 200) progCache.clear()
  progCache.set(src, prog)
  return prog
}

// ------------------------------------------------------------- Evaluación
/** Función nativa expuesta al código del alumno. */
export type HostFn = ((...args: unknown[]) => unknown) & { __host: true }

export function host(fn: (...args: unknown[]) => unknown): HostFn {
  const f = fn as HostFn
  f.__host = true
  return f
}

export class Closure {
  readonly node: Extract<Node, { t: 'fn' }>
  readonly scope: Scope
  readonly interp: Interpreter
  constructor(node: Extract<Node, { t: 'fn' }>, scope: Scope, interp: Interpreter) {
    this.node = node
    this.scope = scope
    this.interp = interp
  }
  toString() {
    return `function ${this.node.name ?? ''}(…)`
  }
}

export class Scope {
  private vars = new Map<string, { v: unknown; c: boolean }>()
  readonly parent?: Scope
  constructor(parent?: Scope) {
    this.parent = parent
  }
  has(name: string): boolean {
    return this.vars.has(name) || !!this.parent?.has(name)
  }
  lookup(name: string): { v: unknown; c: boolean } | undefined {
    return this.vars.get(name) ?? this.parent?.lookup(name)
  }
  declare(name: string, v: unknown, constant = false) {
    this.vars.set(name, { v, c: constant })
  }
  set(name: string, v: unknown) {
    const slot = this.lookup(name)
    if (slot) {
      if (slot.c) throw new JsError(`no se puede reasignar la constante «${name}»`)
      slot.v = v
    } else {
      // Como en JavaScript no estricto: asignar sin declarar crea una global.
      this.root().declare(name, v)
    }
  }
  private root(): Scope {
    return this.parent ? this.parent.root() : this
  }
  /** Variables propias (sin las heredadas). */
  own(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, slot] of this.vars) out[k] = slot.v
    return out
  }
}

class Signal {
  kind: 'ret' | 'brk' | 'cont'
  value?: unknown
  constructor(kind: 'ret' | 'brk' | 'cont', value?: unknown) {
    this.kind = kind
    this.value = value
  }
}

class Thrown {
  value: unknown
  constructor(value: unknown) {
    this.value = value
  }
}

const BLOCKED = new Set(['__proto__', 'constructor', 'prototype', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__'])

const STRING_METHODS = new Set([
  'toUpperCase', 'toLowerCase', 'trim', 'trimStart', 'trimEnd', 'startsWith', 'endsWith', 'includes', 'indexOf', 'lastIndexOf',
  'substring', 'substr', 'slice', 'split', 'replace', 'replaceAll', 'charAt', 'charCodeAt', 'padStart', 'padEnd', 'repeat', 'concat', 'at', 'localeCompare',
])
const ARRAY_METHODS = new Set([
  'map', 'filter', 'find', 'findIndex', 'some', 'every', 'reduce', 'forEach', 'includes', 'indexOf', 'lastIndexOf', 'join', 'slice',
  'concat', 'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'flat', 'flatMap', 'splice', 'fill', 'at',
])
const NUMBER_METHODS = new Set(['toFixed', 'toString', 'toPrecision'])

export interface InterpreterOptions {
  /** Pasos máximos antes de abortar (bucles infinitos). */
  maxSteps?: number
}

export class Interpreter {
  steps = 0
  readonly maxSteps: number
  readonly globals: Scope

  constructor(opts: InterpreterOptions = {}) {
    this.maxSteps = opts.maxSteps ?? 200_000
    this.globals = new Scope()
    installGlobals(this.globals, this)
  }

  private tick() {
    if (++this.steps > this.maxSteps) throw new JsError('la ejecución superó el límite de pasos (¿un bucle infinito?)')
  }

  /** Evalúa una expresión. */
  evalExpression(src: string, scope: Scope): unknown {
    return this.eval(parseExpression(src), scope)
  }

  /** Ejecuta un programa y devuelve el valor de la última expresión. */
  runProgram(src: string, scope: Scope): unknown {
    const prog = parseProgram(src)
    let last: unknown
    this.hoist(prog, scope)
    for (const st of prog) {
      const r = this.exec(st, scope)
      if (r instanceof Signal) {
        if (r.kind === 'ret') return r.value
        break
      }
      if (st.t === 'expr') last = r
    }
    return last
  }

  private hoist(body: Stmt[], scope: Scope) {
    for (const st of body) if (st.t === 'func') scope.declare(st.name, new Closure(st.fn as Extract<Node, { t: 'fn' }>, scope, this))
  }

  private execBlock(body: Stmt[], scope: Scope): unknown {
    this.hoist(body, scope)
    for (const st of body) {
      const r = this.exec(st, scope)
      if (r instanceof Signal) return r
    }
    return undefined
  }

  private exec(st: Stmt, scope: Scope): unknown {
    this.tick()
    switch (st.t) {
      case 'expr':
        return this.eval(st.e, scope)
      case 'var':
        for (const d of st.decls) scope.declare(d.name, d.init ? this.eval(d.init, scope) : undefined, st.kind === 'const')
        return undefined
      case 'func':
        return undefined
      case 'ret':
        return new Signal('ret', st.e ? this.eval(st.e, scope) : undefined)
      case 'if':
        if (truthy(this.eval(st.test, scope))) return this.exec(st.yes, new Scope(scope))
        return st.no ? this.exec(st.no, new Scope(scope)) : undefined
      case 'block':
        return this.execBlock(st.body, new Scope(scope))
      case 'for': {
        const s = new Scope(scope)
        if (st.init) this.exec(st.init, s)
        while (!st.test || truthy(this.eval(st.test, s))) {
          this.tick()
          const r = this.exec(st.body, new Scope(s))
          if (r instanceof Signal) {
            if (r.kind === 'brk') break
            if (r.kind === 'ret') return r
          }
          if (st.update) this.eval(st.update, s)
        }
        return undefined
      }
      case 'forof': {
        const it = this.eval(st.iter, scope)
        let list: unknown[]
        if (st.of) {
          if (typeof it === 'string') list = Array.from(it)
          else if (Array.isArray(it)) list = it.slice()
          else throw new JsError(`${describe(it)} no es iterable`)
        } else list = it && typeof it === 'object' ? Object.keys(it) : []
        for (const v of list) {
          this.tick()
          const s = new Scope(scope)
          s.declare(st.name, v, st.kind === 'const')
          const r = this.exec(st.body, s)
          if (r instanceof Signal) {
            if (r.kind === 'brk') break
            if (r.kind === 'ret') return r
          }
        }
        return undefined
      }
      case 'while':
        while (truthy(this.eval(st.test, scope))) {
          this.tick()
          const r = this.exec(st.body, new Scope(scope))
          if (r instanceof Signal) {
            if (r.kind === 'brk') break
            if (r.kind === 'ret') return r
          }
        }
        return undefined
      case 'brk':
        return new Signal('brk')
      case 'cont':
        return new Signal('cont')
      case 'throw':
        throw new Thrown(this.eval(st.e, scope))
      case 'empty':
        return undefined
    }
  }

  call(fn: unknown, args: unknown[], thisArg?: unknown): unknown {
    this.tick()
    if (fn instanceof Closure) return fn.interp.invoke(fn, args)
    if (typeof fn === 'function' && (fn as HostFn).__host) return (fn as HostFn).apply(thisArg, args)
    throw new JsError(`${describe(fn)} no es una función`)
  }

  private invoke(fn: Closure, args: unknown[]): unknown {
    const node = fn.node
    const s = new Scope(fn.scope)
    node.params.forEach((p, i) => {
      if (p.rest) s.declare(p.name, args.slice(i))
      else s.declare(p.name, args[i] === undefined && p.def ? this.eval(p.def, s) : args[i])
    })
    if (!node.arrow) s.declare('arguments', args)
    if (!Array.isArray(node.body)) return this.eval(node.body, s)
    try {
      const r = this.execBlock(node.body, s)
      return r instanceof Signal && r.kind === 'ret' ? r.value : undefined
    } catch (e) {
      if (e instanceof RangeError) throw new JsError('demasiadas llamadas anidadas (¿recursión infinita?)')
      throw e
    }
  }

  eval(n: Node, scope: Scope): unknown {
    this.tick()
    switch (n.t) {
      case 'num':
      case 'str':
        return n.v
      case 'lit':
        return n.v
      case 'tpl': {
        let out = n.text[0]
        n.exprs.forEach((e, i) => {
          out += toStr(this.eval(e, scope)) + n.text[i + 1]
        })
        return out
      }
      case 'id': {
        const slot = scope.lookup(n.name)
        if (!slot) throw new JsError(`«${n.name}» no está definido`)
        return slot.v
      }
      case 'arr': {
        const out: unknown[] = []
        for (const it of n.items) {
          if ('t' in it && it.t === 'spread') {
            const v = this.eval(it.arg, scope)
            if (!Array.isArray(v)) throw new JsError('solo se pueden expandir arrays con «...»')
            out.push(...v)
          } else out.push(this.eval(it as Node, scope))
        }
        return out
      }
      case 'obj': {
        const out: Record<string, unknown> = {}
        for (const p of n.props) {
          if ('t' in p && p.t === 'spread') {
            const v = this.eval(p.arg, scope)
            if (v && typeof v === 'object') Object.assign(out, v)
          } else {
            const pp = p as { key: string | Node; value: Node }
            const key = typeof pp.key === 'string' ? pp.key : toStr(this.eval(pp.key, scope))
            if (BLOCKED.has(key)) throw new JsError(`la propiedad «${key}» no está permitida`)
            out[key] = this.eval(pp.value, scope)
          }
        }
        return out
      }
      case 'mem': {
        const obj = this.eval(n.obj, scope)
        if (n.optional && (obj === null || obj === undefined)) return undefined
        const key = n.computed ? this.eval(n.prop as Node, scope) : (n.prop as string)
        return getProp(obj, key, this)
      }
      case 'call': {
        let thisArg: unknown
        let fn: unknown
        if (n.callee.t === 'mem') {
          thisArg = this.eval(n.callee.obj, scope)
          if (n.callee.optional && (thisArg === null || thisArg === undefined)) return undefined
          const key = n.callee.computed ? this.eval(n.callee.prop as Node, scope) : (n.callee.prop as string)
          fn = getProp(thisArg, key, this)
          if (fn === undefined) throw new JsError(`${describe(thisArg)} no tiene el método «${String(key)}»`)
        } else fn = this.eval(n.callee, scope)
        if (n.optional && (fn === null || fn === undefined)) return undefined
        const args: unknown[] = []
        for (const a of n.args) {
          if ('t' in a && a.t === 'spread') {
            const v = this.eval(a.arg, scope)
            if (!Array.isArray(v)) throw new JsError('solo se pueden expandir arrays con «...»')
            args.push(...v)
          } else args.push(this.eval(a as Node, scope))
        }
        return this.call(fn, args, thisArg)
      }
      case 'new': {
        if (n.callee.t === 'id' && n.callee.name === 'Date') {
          const args = n.args.map((a) => this.eval(a, scope))
          return makeDate(args)
        }
        throw new JsError('«new» solo está soportado con Date')
      }
      case 'un': {
        if (n.op === 'typeof') {
          if (n.arg.t === 'id' && !scope.lookup(n.arg.name)) return 'undefined'
          const v = this.eval(n.arg, scope)
          if (v instanceof Closure || typeof v === 'function') return 'function'
          return typeof v
        }
        if (n.op === 'delete') {
          if (n.arg.t !== 'mem') return true
          const obj = this.eval(n.arg.obj, scope)
          const key = n.arg.computed ? toStr(this.eval(n.arg.prop as Node, scope)) : (n.arg.prop as string)
          if (obj && typeof obj === 'object' && !BLOCKED.has(key)) delete (obj as Record<string, unknown>)[key]
          return true
        }
        const v = this.eval(n.arg, scope)
        switch (n.op) {
          case '!':
            return !truthy(v)
          case '-':
            return -(v as number)
          case '+':
            return Number(v)
          case '~':
            return ~(v as number)
          case 'void':
            return undefined
        }
        throw new JsError(`operador no soportado: ${n.op}`)
      }
      case 'upd': {
        const old = Number(this.eval(n.arg, scope))
        const val = n.op === '++' ? old + 1 : old - 1
        this.assignTo(n.arg, val, scope)
        return n.prefix ? val : old
      }
      case 'bin':
        return binop(n.op, this.eval(n.l, scope), this.eval(n.r, scope))
      case 'log': {
        const l = this.eval(n.l, scope)
        if (n.op === '&&') return truthy(l) ? this.eval(n.r, scope) : l
        if (n.op === '||') return truthy(l) ? l : this.eval(n.r, scope)
        return l === null || l === undefined ? this.eval(n.r, scope) : l
      }
      case 'cond':
        return truthy(this.eval(n.test, scope)) ? this.eval(n.yes, scope) : this.eval(n.no, scope)
      case 'asg': {
        if (n.op === '=') {
          const v = this.eval(n.value, scope)
          this.assignTo(n.target, v, scope)
          return v
        }
        const cur = this.eval(n.target, scope)
        if (n.op === '&&=') return truthy(cur) ? this.assignTo(n.target, this.eval(n.value, scope), scope) : cur
        if (n.op === '||=') return truthy(cur) ? cur : this.assignTo(n.target, this.eval(n.value, scope), scope)
        if (n.op === '??=') return cur ?? this.assignTo(n.target, this.eval(n.value, scope), scope)
        const v = binop(n.op.slice(0, -1), cur, this.eval(n.value, scope))
        return this.assignTo(n.target, v, scope)
      }
      case 'fn':
        return new Closure(n, scope, this)
      case 'seq': {
        let last: unknown
        for (const e of n.items) last = this.eval(e, scope)
        return last
      }
    }
  }

  private assignTo(target: Node, v: unknown, scope: Scope): unknown {
    if (target.t === 'id') {
      scope.set(target.name, v)
      return v
    }
    if (target.t === 'mem') {
      const obj = this.eval(target.obj, scope)
      const key = target.computed ? this.eval(target.prop as Node, scope) : (target.prop as string)
      const k = typeof key === 'number' ? key : toStr(key)
      if (typeof k === 'string' && BLOCKED.has(k)) throw new JsError(`la propiedad «${k}» no está permitida`)
      if (obj === null || obj === undefined) throw new JsError(`no se puede asignar «${String(k)}» de ${describe(obj)}`)
      if (typeof obj !== 'object') throw new JsError(`no se puede asignar una propiedad a ${describe(obj)}`)
      ;(obj as Record<string | number, unknown>)[k] = v
      return v
    }
    throw new JsError('asignación no válida')
  }
}

// ---------------------------------------------------------------- Helpers
export function truthy(v: unknown): boolean {
  return !!v
}

export function toStr(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'object' && !(v instanceof Closure)) return Array.isArray(v) ? v.map((x) => (x === null || x === undefined ? '' : toStr(x))).join(',') : '[object Object]'
  return String(v)
}

export function describe(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (Array.isArray(v)) return 'un array'
  if (v instanceof Closure) return 'una función'
  if (typeof v === 'object') return 'un objeto'
  if (typeof v === 'string') return `el string «${v.length > 30 ? v.slice(0, 30) + '…' : v}»`
  return `${typeof v === 'number' ? 'el número' : 'el valor'} ${String(v)}`
}

function binop(op: string, a: unknown, b: unknown): unknown {
  switch (op) {
    case '+':
      if (typeof a === 'string' || typeof b === 'string' || (a && typeof a === 'object') || (b && typeof b === 'object')) return toStr(a) + toStr(b)
      return (a as number) + (b as number)
    case '-':
      return (a as number) - (b as number)
    case '*':
      return (a as number) * (b as number)
    case '/':
      return (a as number) / (b as number)
    case '%':
      return (a as number) % (b as number)
    case '**':
      return (a as number) ** (b as number)
    case '==':
      return a == b
    case '!=':
      return a != b
    case '===':
      return a === b
    case '!==':
      return a !== b
    case '<':
      return (a as number) < (b as number)
    case '>':
      return (a as number) > (b as number)
    case '<=':
      return (a as number) <= (b as number)
    case '>=':
      return (a as number) >= (b as number)
    case '&':
      return (a as number) & (b as number)
    case '|':
      return (a as number) | (b as number)
    case '^':
      return (a as number) ^ (b as number)
    case '<<':
      return (a as number) << (b as number)
    case '>>':
      return (a as number) >> (b as number)
    case '>>>':
      return (a as number) >>> (b as number)
    case 'in':
      return !!b && typeof b === 'object' && Object.prototype.hasOwnProperty.call(b, toStr(a))
    case 'instanceof':
      return false
  }
  throw new JsError(`operador no soportado: ${op}`)
}

/** Lectura de propiedades con lista blanca (nada de prototipos). */
export function getProp(obj: unknown, key: unknown, interp: Interpreter): unknown {
  const k = typeof key === 'number' ? key : toStr(key)
  if (typeof k === 'string' && BLOCKED.has(k)) throw new JsError(`la propiedad «${k}» no está permitida`)
  if (obj === null || obj === undefined) throw new JsError(`no se puede leer «${String(k)}» de ${describe(obj)}`)
  if (typeof obj === 'string') {
    if (k === 'length') return obj.length
    if (typeof k === 'number' || /^\d+$/.test(k)) return obj[Number(k)]
    if (STRING_METHODS.has(k)) return stringMethod(obj, k, interp)
    return undefined
  }
  if (typeof obj === 'number') {
    if (NUMBER_METHODS.has(k as string)) return host((...a: unknown[]) => (obj as unknown as Record<string, (...x: unknown[]) => unknown>)[k as string](...a))
    return undefined
  }
  if (typeof obj === 'boolean') return undefined
  if (Array.isArray(obj)) {
    if (k === 'length') return obj.length
    if (typeof k === 'number' || /^\d+$/.test(k as string)) return obj[Number(k)]
    if (ARRAY_METHODS.has(k as string)) return arrayMethod(obj, k as string, interp)
    return undefined
  }
  if (obj instanceof Closure) {
    if (k === 'call') return host((self: unknown, ...a: unknown[]) => interp.call(obj, a, self))
    if (k === 'apply') return host((self: unknown, a: unknown) => interp.call(obj, Array.isArray(a) ? a : [], self))
    return undefined
  }
  if (typeof obj === 'object' || typeof obj === 'function') {
    const rec = obj as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(rec, k)) return rec[k as string]
    if (obj instanceof KDate) return obj.get(k as string)
    return undefined
  }
  return undefined
}

function stringMethod(s: string, k: string, interp: Interpreter): HostFn {
  return host((...args: unknown[]) => {
    if ((k === 'replace' || k === 'replaceAll') && typeof args[1] !== 'string') {
      const fn = args[1]
      const pat = toStr(args[0])
      const replacer = (m: string) => toStr(interp.call(fn, [m]))
      return k === 'replace' ? s.replace(pat, replacer) : s.split(pat).join(replacer(pat))
    }
    const a = args.map((x) => (x instanceof Closure ? undefined : x))
    return (s as unknown as Record<string, (...x: unknown[]) => unknown>)[k](...a)
  })
}

function arrayMethod(arr: unknown[], k: string, interp: Interpreter): HostFn {
  const cb = (fn: unknown) => (...a: unknown[]) => interp.call(fn, a)
  return host((...args: unknown[]) => {
    switch (k) {
      case 'map':
        return arr.map((v, i) => interp.call(args[0], [v, i, arr]))
      case 'filter':
        return arr.filter((v, i) => truthy(interp.call(args[0], [v, i, arr])))
      case 'find':
        return arr.find((v, i) => truthy(interp.call(args[0], [v, i, arr])))
      case 'findIndex':
        return arr.findIndex((v, i) => truthy(interp.call(args[0], [v, i, arr])))
      case 'some':
        return arr.some((v, i) => truthy(interp.call(args[0], [v, i, arr])))
      case 'every':
        return arr.every((v, i) => truthy(interp.call(args[0], [v, i, arr])))
      case 'forEach':
        arr.forEach((v, i) => interp.call(args[0], [v, i, arr]))
        return undefined
      case 'reduce': {
        const f = cb(args[0])
        return args.length > 1 ? arr.reduce((acc, v, i) => f(acc, v, i, arr), args[1]) : arr.reduce((acc, v, i) => f(acc, v, i, arr))
      }
      case 'flatMap':
        return arr.flatMap((v, i) => interp.call(args[0], [v, i, arr]) as unknown[])
      case 'sort': {
        if (args[0] === undefined) return arr.sort()
        const f = cb(args[0])
        return arr.sort((x, y) => Number(f(x, y)))
      }
      default:
        return (arr as unknown as Record<string, (...x: unknown[]) => unknown>)[k](...args)
    }
  })
}

/** Fecha mínima: solo lo necesario para timestamps y comparaciones. */
export class KDate {
  readonly ms: number
  constructor(ms: number) {
    this.ms = ms
  }
  get(k: string): unknown {
    const d = new Date(this.ms)
    switch (k) {
      case 'getTime':
        return host(() => this.ms)
      case 'toISOString':
        return host(() => d.toISOString())
      case 'getFullYear':
        return host(() => d.getUTCFullYear())
      case 'getMonth':
        return host(() => d.getUTCMonth())
      case 'getDate':
        return host(() => d.getUTCDate())
      case 'getDay':
        return host(() => d.getUTCDay())
      case 'getHours':
        return host(() => d.getUTCHours())
      default:
        return undefined
    }
  }
}

/** Reloj fijo de la simulación: «ahora» es siempre el mismo (determinista). */
export const SIM_NOW = Date.UTC(2026, 9, 19, 9, 0, 0)

function makeDate(args: unknown[]): KDate {
  if (args.length === 0) return new KDate(SIM_NOW)
  const v = args[0]
  if (typeof v === 'number') return new KDate(v)
  const ms = Date.parse(toStr(v))
  if (Number.isNaN(ms)) throw new JsError(`fecha no válida: ${toStr(v)}`)
  return new KDate(ms)
}

/** Copia profunda a valores planos (para JSON y comparación). */
export function toPlain(v: unknown, depth = 0): unknown {
  if (depth > 60) throw new JsError('estructura demasiado anidada')
  if (v instanceof Closure) return v
  if (v instanceof KDate) return new Date(v.ms).toISOString()
  if (Array.isArray(v)) return v.map((x) => toPlain(x, depth + 1))
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v)) out[k] = toPlain(x, depth + 1)
    return out
  }
  return v
}

export function jsonStringify(v: unknown, indent?: number): string {
  return JSON.stringify(
    toPlain(v),
    (_k, x) => (x instanceof Closure ? undefined : x === undefined ? null : x),
    indent,
  ) ?? 'undefined'
}

function installGlobals(g: Scope, interp: Interpreter) {
  const M = Math
  g.declare(
    'Math',
    {
      abs: host((x) => M.abs(x as number)),
      round: host((x) => M.round(x as number)),
      floor: host((x) => M.floor(x as number)),
      ceil: host((x) => M.ceil(x as number)),
      trunc: host((x) => M.trunc(x as number)),
      min: host((...x) => M.min(...(x as number[]))),
      max: host((...x) => M.max(...(x as number[]))),
      pow: host((a, b) => M.pow(a as number, b as number)),
      sqrt: host((x) => M.sqrt(x as number)),
      sign: host((x) => M.sign(x as number)),
      PI: M.PI,
    },
    true,
  )
  g.declare(
    'JSON',
    {
      stringify: host((v, _r, ind) => jsonStringify(v, typeof ind === 'number' ? ind : undefined)),
      parse: host((s) => {
        try {
          return JSON.parse(toStr(s))
        } catch {
          throw new JsError('JSON.parse: el texto no es JSON válido')
        }
      }),
    },
    true,
  )
  g.declare(
    'Object',
    {
      keys: host((o) => (o && typeof o === 'object' ? Object.keys(o) : [])),
      values: host((o) => (o && typeof o === 'object' ? Object.values(o) : [])),
      entries: host((o) => (o && typeof o === 'object' ? Object.entries(o) : [])),
      assign: host((t, ...src) => {
        for (const s of src) if (s && typeof s === 'object') Object.assign(t as object, toPlain(s))
        return t
      }),
    },
    true,
  )
  g.declare('Array', { isArray: host((v) => Array.isArray(v)) }, true)
  g.declare('parseInt', host((s, r) => parseInt(toStr(s), (r as number) || 10)), true)
  g.declare('parseFloat', host((s) => parseFloat(toStr(s))), true)
  g.declare('isNaN', host((v) => Number.isNaN(Number(v))), true)
  g.declare('Number', Object.assign(host((v) => Number(v)), { isInteger: host((v) => Number.isInteger(v)) }), true)
  g.declare('String', host((v) => toStr(v)), true)
  g.declare('Boolean', host((v) => truthy(v)), true)
  g.declare('Date', { now: host(() => SIM_NOW) }, true)
  void interp
}
