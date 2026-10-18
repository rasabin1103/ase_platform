import { Fragment, type ReactNode } from 'react'
import type { Npc } from './engine/types'
import type { AcademyLang } from './i18n'

export function Avatar({ npc, size = 'md' }: { npc: Npc; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ase-bg ${dim}`}
      style={{ backgroundColor: npc.color }}
      aria-hidden
    >
      {npc.avatar}
    </span>
  )
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ase-text">
        {part.slice(2, -2)}
      </strong>
    ) : part.length > 2 && part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded bg-black/30 px-1 py-px font-mono text-[0.92em] text-ase-text">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/** Markdown mínimo: párrafos, `## títulos`, listas `- `, **negrita**, `código` y bloques ``` de código. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="ml-5 list-disc space-y-1">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }
  let code: string[] | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (line.trimStart().startsWith('```')) {
      if (code) {
        blocks.push(
          <pre key={`c${blocks.length}`} className="overflow-x-auto rounded-ase-md bg-black/40 p-3 font-mono text-[12px] leading-[18px] text-ase-text">
            {code.join('\n')}
          </pre>,
        )
        code = null
      } else {
        flush()
        code = []
      }
      continue
    }
    if (code) {
      code.push(raw)
      continue
    }
    if (line.startsWith('- ')) {
      list.push(line.slice(2))
      continue
    }
    flush()
    if (!line.trim()) continue
    if (line.startsWith('## '))
      blocks.push(
        <h3 key={blocks.length} className="pt-2 font-sans text-body-md font-semibold text-ase-text">
          {line.slice(3)}
        </h3>,
      )
    else blocks.push(<p key={blocks.length}>{inline(line)}</p>)
  }
  flush()
  return <div className={`space-y-2 text-body-sm leading-relaxed text-ase-text2 ${className}`}>{blocks}</div>
}

export function Stars({ value, lang = 'es' }: { value: number; lang?: AcademyLang }) {
  return (
    <span className="tracking-widest" aria-label={lang === 'en' ? `${value} of 5` : `${value} de 5`}>
      <span className="text-ase-gold">{'★'.repeat(value)}</span>
      <span className="text-white/15">{'★'.repeat(5 - value)}</span>
    </span>
  )
}
