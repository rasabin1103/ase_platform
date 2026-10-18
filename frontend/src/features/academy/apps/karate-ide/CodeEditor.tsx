import { forwardRef, useImperativeHandle, useMemo, useRef, type KeyboardEvent } from 'react'
import { highlightFile } from './highlight'

const LINE_H = 20
const PAD = 12

export interface CodeEditorHandle {
  /** Inserta texto en el cursor (respetando la sangría de la línea). */
  insert: (text: string) => void
  focus: () => void
  goToLine: (line: number) => void
}

interface Props {
  path: string
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  /** Líneas con error (1-based) y su mensaje. */
  errors?: Map<number, string>
  /** Líneas de escenarios que pasan (1-based). */
  passed?: Set<number>
  onRun?: () => void
  label: string
}

/**
 * Editor de código ligero: textarea transparente sobre un <pre> resaltado.
 * Sin dependencias. El textarea crece con el contenido, así que no hay que
 * sincronizar el scroll: el contenedor es el que hace scroll.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor({ path, value, onChange, readOnly, errors, passed, onRun, label }, ref) {
  const ta = useRef<HTMLTextAreaElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => value.split('\n'), [value])
  const highlighted = useMemo(() => highlightFile(path, value), [path, value])
  const longest = useMemo(() => lines.reduce((n, l) => Math.max(n, l.length), 0), [lines])

  const replaceRange = (start: number, end: number, text: string, caret: number) => {
    const el = ta.current
    if (!el) return
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = caret
    })
  }

  useImperativeHandle(ref, () => ({
    insert(text: string) {
      const el = ta.current
      if (!el || readOnly) return
      const start = el.selectionStart
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const indent = /^\s*/.exec(value.slice(lineStart, start))?.[0] ?? ''
      const atLineStart = value.slice(lineStart, start).trim() === ''
      const body = text.split('\n').join('\n' + indent)
      const prefix = atLineStart ? '' : '\n' + indent
      replaceRange(start, el.selectionEnd, prefix + body, start + prefix.length + body.length)
      el.focus()
    },
    focus() {
      ta.current?.focus()
    },
    goToLine(line: number) {
      const el = ta.current
      if (!el) return
      const idx = lines.slice(0, Math.max(0, line - 1)).reduce((n, l) => n + l.length + 1, 0)
      el.focus()
      el.selectionStart = el.selectionEnd = idx
      scroller.current?.scrollTo({ top: Math.max(0, (line - 4) * LINE_H), behavior: 'smooth' })
    },
  }))

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onRun?.()
      return
    }
    if (readOnly) return
    const { selectionStart: s, selectionEnd: en } = el
    if (e.key === 'Tab') {
      e.preventDefault()
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      if (e.shiftKey) {
        const ls = value.slice(lineStart)
        const n = /^ {1,2}/.exec(ls)?.[0].length ?? 0
        if (n) replaceRange(lineStart, lineStart + n, '', Math.max(lineStart, s - n))
        return
      }
      if (s !== en && value.slice(s, en).includes('\n')) {
        // Sangrar varias líneas.
        const block = value.slice(lineStart, en)
        const indented = block.replace(/^/gm, '  ')
        replaceRange(lineStart, en, indented, lineStart + indented.length)
        return
      }
      replaceRange(s, en, '  ', s + 2)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const current = value.slice(lineStart, s)
      let indent = /^\s*/.exec(current)?.[0] ?? ''
      const t = current.trim()
      if (/^(Feature|Background|Scenario|Scenario Outline|Examples):/.test(t) || /[{[]$/.test(t)) indent += '  '
      replaceRange(s, en, '\n' + indent, s + 1 + indent.length)
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const lineEndIdx = value.indexOf('\n', en)
      const lineEnd = lineEndIdx < 0 ? value.length : lineEndIdx
      const block = value.slice(lineStart, lineEnd)
      const mark = path.endsWith('.feature') ? '#' : '//'
      const allCommented = block.split('\n').every((l) => l.trim() === '' || l.trimStart().startsWith(mark))
      const next = block
        .split('\n')
        .map((l) => (l.trim() === '' ? l : allCommented ? l.replace(new RegExp(`^(\\s*)${mark === '#' ? '#' : '\\/\\/'} ?`), '$1') : l.replace(/^(\s*)/, `$1${mark} `)))
        .join('\n')
      replaceRange(lineStart, lineEnd, next, lineStart + next.length)
    }
  }

  const height = lines.length * LINE_H + PAD * 2

  return (
    <div ref={scroller} className="relative h-full min-h-0 overflow-auto bg-[#0d1117] font-mono text-[13px]" style={{ lineHeight: `${LINE_H}px` }}>
      <div className="flex min-w-full" style={{ minHeight: height }}>
        <div aria-hidden className="sticky left-0 z-10 shrink-0 select-none border-r border-white/5 bg-[#0d1117] text-right text-slate-600" style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {lines.map((_, i) => {
            const n = i + 1
            const err = errors?.get(n)
            return (
              <div key={n} className="flex items-center justify-end gap-1 pl-2 pr-3" style={{ height: LINE_H }} title={err}>
                {err ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : passed?.has(n) ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <span className="w-2" />}
                <span className={err ? 'text-rose-300' : ''}>{n}</span>
              </div>
            )
          })}
        </div>
        <div className="relative flex-1">
          <pre aria-hidden className="pointer-events-none m-0 whitespace-pre" style={{ padding: `${PAD}px ${PAD}px`, minWidth: `calc(${longest}ch + ${PAD * 2}px)` }}>
            {highlighted.map((node, i) => (
              <div key={i} className={errors?.has(i + 1) ? '-mx-3 bg-rose-500/10 px-3' : ''} style={{ height: LINE_H }}>
                {node}
                {lines[i] === '' ? '​' : null}
              </div>
            ))}
          </pre>
          <textarea
            ref={ta}
            aria-label={label}
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            className="absolute inset-0 m-0 resize-none overflow-hidden whitespace-pre border-0 bg-transparent font-mono text-[13px] text-transparent caret-amber-300 outline-none selection:bg-sky-400/30"
            style={{ padding: `${PAD}px ${PAD}px`, lineHeight: `${LINE_H}px`, minWidth: `calc(${longest}ch + ${PAD * 2}px)`, height, tabSize: 2 }}
          />
        </div>
      </div>
    </div>
  )
})
