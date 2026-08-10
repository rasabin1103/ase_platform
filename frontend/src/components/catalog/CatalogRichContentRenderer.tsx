import { cn } from '../ui/cn'

type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'quote'; text: string }

function parseBasicMarkdown(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ kind: 'list', items: [...listItems] })
      listItems = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      blocks.push({ kind: 'heading', level: 2, text: trimmed.slice(3).trim() })
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      blocks.push({ kind: 'heading', level: 3, text: trimmed.slice(4).trim() })
      continue
    }
    if (trimmed.startsWith('> ')) {
      flushList()
      blocks.push({ kind: 'quote', text: trimmed.slice(2).trim() })
      continue
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2).trim())
      continue
    }
    flushList()
    blocks.push({ kind: 'paragraph', text: trimmed })
  }
  flushList()
  return blocks
}

type Props = {
  markdown?: string | null
  fallbackText?: string | null
  className?: string
}

export function CatalogRichContentRenderer({ markdown, fallbackText, className }: Props) {
  const source = (markdown?.trim() || fallbackText?.trim() || '').trim()
  if (!source) return null

  const blocks = parseBasicMarkdown(source)

  return (
    <div className={cn('space-y-5 text-ase-text2', className)}>
      {blocks.map((block, idx) => {
        if (block.kind === 'heading') {
          const Tag = block.level === 2 ? 'h2' : 'h3'
          return (
            <Tag
              key={idx}
              className={cn(
                'font-semibold text-ase-text',
                block.level === 2 ? 'text-xl tracking-tight' : 'text-lg',
              )}
            >
              {block.text}
            </Tag>
          )
        }
        if (block.kind === 'quote') {
          return (
            <blockquote
              key={idx}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 px-5 py-4 text-sm italic text-ase-text"
            >
              {block.text}
            </blockquote>
          )
        }
        if (block.kind === 'list') {
          return (
            <ul key={idx} className="space-y-2 pl-1 text-sm">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-cyan-300">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={idx} className="text-sm leading-relaxed sm:text-base">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
