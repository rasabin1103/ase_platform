import { useState } from 'react'
import { cn } from '../ui/cn'
import { markdownToReadableText } from '../../utils/catalogDescription'

type Props = {
  markdown: string | null | undefined
  /** Texto que ya se muestra encima (la descripción corta): si la larga empieza igual, se omite. */
  skipIfStartsWith?: string
  readMore: string
  readLess: string
  /** Líneas visibles antes de pulsar «Ver más». */
  lines?: 2 | 3 | 4
  className?: string
  /** Modo controlado: el padre decide si está desplegada (p. ej. para destacar la tarjeta). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CLAMP: Record<NonNullable<Props['lines']>, string> = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' }

/** Descripción completa de un ítem del catálogo, plegada con «Ver más» / «Ver menos». */
export function ExpandableDescription({
  markdown,
  skipIfStartsWith,
  readMore,
  readLess,
  lines = 4,
  className,
  open: openProp,
  onOpenChange,
}: Props) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOpenState(v))
  let text = markdownToReadableText(markdown)
  const skip = (skipIfStartsWith ?? '').trim()
  if (skip && text.toLowerCase().startsWith(skip.toLowerCase())) text = text.slice(skip.length).trim()
  if (!text) return null
  const long = text.length > 160 || text.includes('\n')

  return (
    <div className={className}>
      <p className={cn('whitespace-pre-line text-[13px] leading-relaxed text-ase-text2', !open && long && CLAMP[lines])}>
        {/* Plegado, los párrafos se unen para que las líneas visibles sean texto y no huecos. */}
        {open || !long ? text : text.replace(/\n+/g, ' ')}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="mt-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
        >
          {open ? readLess : readMore}
        </button>
      )}
    </div>
  )
}
