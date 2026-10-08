import { Fragment, type ReactNode } from 'react'
import type { Npc } from './engine/types'

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
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ase-text">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/** Markdown mínimo: párrafos, `## títulos`, listas `- ` y **negrita**. */
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
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
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

export function Stars({ value }: { value: number }) {
  return (
    <span className="tracking-widest" aria-label={`${value} de 5`}>
      <span className="text-ase-gold">{'★'.repeat(value)}</span>
      <span className="text-white/15">{'★'.repeat(5 - value)}</span>
    </span>
  )
}
