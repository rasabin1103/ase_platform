import type { ReactNode } from 'react'

/**
 * Resaltado de sintaxis ligero para .feature (Karate) y .js/.json.
 * Trabaja línea a línea con un estado mínimo (dentro de un docstring).
 */

const SECTION = /^(\s*)(Feature|Background|Scenario Outline|Scenario Template|Scenario|Examples|Scenarios)(:)(.*)$/
const STEP = /^(\s*)(Given|When|Then|And|But|\*)(\s+)(.*)$/
const KARATE_KW = /^(url|path|params|param|headers|header|request|method|status|match each|match|def|assert|print|configure|eval|text|json|retry until|call|callonce)\b/
const JS_KW = new Set(['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'of', 'in', 'while', 'true', 'false', 'null', 'undefined', 'typeof', 'new'])

export const C = {
  comment: 'text-slate-500 italic',
  section: 'text-fuchsia-300 font-semibold',
  sectionName: 'text-slate-100 font-semibold',
  step: 'text-sky-300',
  kw: 'text-teal-300',
  str: 'text-amber-200',
  marker: 'text-emerald-300',
  num: 'text-violet-300',
  op: 'text-pink-300',
  tag: 'text-pink-300',
  pipe: 'text-slate-500',
  jskw: 'text-sky-300',
  plain: 'text-slate-200',
  doc: 'text-amber-100/90',
}

/** Resalta una expresión (JS/JSON/Karate) dentro de una línea. */
export function highlightExpr(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0
  let plain = ''
  let k = 0
  const flush = () => {
    if (plain) out.push(<span key={`${keyBase}-p${k++}`} className={C.plain}>{plain}</span>)
    plain = ''
  }
  while (i < text.length) {
    const c = text[i]
    if (c === "'" || c === '"' || c === '`') {
      flush()
      let j = i + 1
      while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1
      const s = text.slice(i, Math.min(j + 1, text.length))
      const inner = s.slice(1, -1)
      out.push(
        <span key={`${keyBase}-s${k++}`} className={inner.startsWith('#') && !inner.startsWith('#(') ? C.marker : C.str}>
          {s}
        </span>,
      )
      i = j + 1
      continue
    }
    if (c === '/' && text[i + 1] === '/') {
      flush()
      out.push(<span key={`${keyBase}-c${k++}`} className={C.comment}>{text.slice(i)}</span>)
      break
    }
    const num = /^-?\d+(\.\d+)?/.exec(text.slice(i))
    if (num && !/[\w$]/.test(text[i - 1] ?? '')) {
      flush()
      out.push(<span key={`${keyBase}-n${k++}`} className={C.num}>{num[0]}</span>)
      i += num[0].length
      continue
    }
    const op = /^(==|!=|!contains|contains only deep|contains only|contains any|contains deep|contains|=>|&&|\|\|)/.exec(text.slice(i))
    if (op && (!/[a-z]/.test(op[0][0]) || (/\s/.test(text[i - 1] ?? ' ') && /\s|$/.test(text[i + op[0].length] ?? '')))) {
      flush()
      out.push(<span key={`${keyBase}-o${k++}`} className={C.op}>{op[0]}</span>)
      i += op[0].length
      continue
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(text.slice(i))
    if (word) {
      if (JS_KW.has(word[0])) {
        flush()
        out.push(<span key={`${keyBase}-k${k++}`} className={C.jskw}>{word[0]}</span>)
      } else plain += word[0]
      i += word[0].length
      continue
    }
    plain += c
    i++
  }
  flush()
  return out
}

/** Resalta un fichero completo y devuelve una lista de nodos por línea. */
export function highlightFile(path: string, content: string): ReactNode[] {
  const lines = content.split('\n')
  if (!path.endsWith('.feature')) return lines.map((l, i) => <>{highlightExpr(l, `l${i}`)}</>)
  let inDoc = false
  return lines.map((line, i) => {
    const key = `l${i}`
    const t = line.trim()
    if (t.startsWith('"""')) {
      inDoc = !inDoc
      return <span className={C.doc}>{line}</span>
    }
    if (inDoc) return <>{highlightExpr(line, key)}</>
    if (t.startsWith('#')) return <span className={C.comment}>{line}</span>
    if (t.startsWith('@')) return <span className={C.tag}>{line}</span>
    if (t.startsWith('|')) {
      return (
        <>
          {line.split(/(\|)/).map((p, j) => (
            <span key={`${key}-${j}`} className={p === '|' ? C.pipe : C.str}>
              {p}
            </span>
          ))}
        </>
      )
    }
    const sec = SECTION.exec(line)
    if (sec) {
      return (
        <>
          {sec[1]}
          <span className={C.section}>{sec[2]}</span>
          <span className={C.section}>{sec[3]}</span>
          <span className={C.sectionName}>{sec[4]}</span>
        </>
      )
    }
    const st = STEP.exec(line)
    if (st) {
      const rest = st[4]
      const kw = KARATE_KW.exec(rest)
      return (
        <>
          {st[1]}
          <span className={C.step}>{st[2]}</span>
          {st[3]}
          {kw ? (
            <>
              <span className={C.kw}>{kw[0]}</span>
              {highlightExpr(rest.slice(kw[0].length), key)}
            </>
          ) : (
            highlightExpr(rest, key)
          )}
        </>
      )
    }
    return <span className={C.plain}>{line}</span>
  })
}
