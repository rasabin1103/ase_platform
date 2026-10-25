import type { ReactNode } from 'react'

/** Resaltado de SQL ligero, línea a línea (palabras clave, textos, números y comentarios). */

const KW = new Set(
  'select from where and or not in is null as order by asc desc limit offset distinct group having join inner left right full outer on union all insert into values update set delete create table primary key foreign references unique check default begin commit rollback case when then else end between like ilike exists count sum avg min max round coalesce true false with drop alter add column'.split(
    ' ',
  ),
)
const TOKEN = /(--.*$)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)|([*=<>!,;().+\-/%]+)/g

const C = { kw: 'text-sky-300 font-semibold', str: 'text-amber-200', num: 'text-violet-300', comment: 'text-slate-500 italic', op: 'text-pink-300' }

function line(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    const [tok, comment, str, num, word, op] = m
    const cls = comment ? C.comment : str ? C.str : num ? C.num : word && KW.has(word.toLowerCase()) ? C.kw : op ? C.op : ''
    out.push(cls ? <span key={`${k}-${i++}`} className={cls}>{tok}</span> : tok)
    last = at + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function highlightSql(content: string): ReactNode[] {
  return content.split('\n').map((l, i) => <>{line(l, `s${i}`)}</>)
}
