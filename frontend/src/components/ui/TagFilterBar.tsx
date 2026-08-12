import { Check, Tags as TagsIcon, X } from 'lucide-react'
import { cn } from './cn'

type Props = {
  tags: string[]
  selected: string[]
  onToggle: (tag: string) => void
  onClear: () => void
  label: string
  clearLabel: string
}

/** Premium multi-select tag filter — a glass pill bar of toggleable chips,
 * used to replace plain `<select>` dropdowns / single-select chip rows on
 * both the admin and public catalog listings. Selecting several tags
 * filters items matching ANY of them (OR semantics). */
export function TagFilterBar({ tags, selected, onToggle, onClear, label, clearLabel }: Props) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 backdrop-blur-md">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ase-muted">
        <TagsIcon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {tags.map((tg) => {
          const active = selected.includes(tg)
          return (
            <button
              key={tg}
              type="button"
              onClick={() => onToggle(tg)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                active
                  ? 'border-cyan-300/50 bg-gradient-to-r from-cyan-400/25 to-blue-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_4px_16px_rgba(34,211,238,0.15)]'
                  : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:bg-white/[0.06] hover:text-ase-text',
              )}
            >
              {active && <Check className="h-3 w-3" strokeWidth={3} />}
              {tg}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-ase-muted transition hover:border-white/20 hover:text-ase-text"
        >
          <X className="h-3 w-3" />
          {clearLabel} ({selected.length})
        </button>
      )}
    </div>
  )
}
