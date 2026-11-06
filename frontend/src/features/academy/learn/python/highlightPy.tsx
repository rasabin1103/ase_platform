import type { ReactNode } from 'react'
import { C } from '../../apps/karate-ide/highlight'

/** Resaltado ligero de Python, línea a línea (las cadenas de varias líneas no se siguen). */

const KW = new Set([
  'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None',
])
const BUILTIN = new Set(['print', 'input', 'int', 'float', 'str', 'bool', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'sum', 'min', 'max', 'round', 'abs', 'sorted', 'enumerate', 'zip', 'open', 'type', 'isinstance'])

function line(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let plain = ''
  let k = 0
  let i = 0
  const flush = () => {
    if (plain) out.push(<span key={`${keyBase}-p${k++}`} className={C.plain}>{plain}</span>)
    plain = ''
  }
  while (i < text.length) {
    const c = text[i]
    if (c === '#') {
      flush()
      out.push(<span key={`${keyBase}-c${k++}`} className={C.comment}>{text.slice(i)}</span>)
      break
    }
    const prefix = /^[fFrRbB]{1,2}(?=["'])/.exec(text.slice(i))
    if (c === '"' || c === "'" || prefix) {
      flush()
      const start = i
      i += prefix ? prefix[0].length : 0
      const q = text[i]
      const triple = text.slice(i, i + 3) === q.repeat(3)
      const close = triple ? q.repeat(3) : q
      let j = i + close.length
      while (j < text.length && text.slice(j, j + close.length) !== close) j += text[j] === '\\' ? 2 : 1
      const end = Math.min(j + close.length, text.length)
      out.push(<span key={`${keyBase}-s${k++}`} className={C.str}>{text.slice(start, end)}</span>)
      i = end
      continue
    }
    const num = /^\d+(\.\d+)?/.exec(text.slice(i))
    if (num && !/\w/.test(text[i - 1] ?? '')) {
      flush()
      out.push(<span key={`${keyBase}-n${k++}`} className={C.num}>{num[0]}</span>)
      i += num[0].length
      continue
    }
    const word = /^[A-Za-z_]\w*/.exec(text.slice(i))
    if (word) {
      const w = word[0]
      if (KW.has(w) || BUILTIN.has(w)) {
        flush()
        out.push(<span key={`${keyBase}-k${k++}`} className={KW.has(w) ? C.jskw : C.kw}>{w}</span>)
      } else plain += w
      i += w.length
      continue
    }
    plain += c
    i++
  }
  flush()
  return out
}

export function highlightPython(content: string): ReactNode[] {
  return content.split('\n').map((l, i) => <>{line(l, `l${i}`)}</>)
}
