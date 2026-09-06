import { ChevronDown, ChevronUp, Copy, ListTree, Search, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'
import type { TocEntry } from './documentViewerTools'

/** Thin progress bar + search box, sat above a viewer's scrollable content
 * area — shared by MarkdownViewer and DocxViewer so both "Ver contenido"
 * viewers get the same search/progress affordances. */
export function DocumentViewerToolbar({
  progress,
  query,
  onQueryChange,
  matchCount,
  activeIndex,
  onPrevMatch,
  onNextMatch,
  tocCount,
  tocOpen,
  onToggleToc,
}: {
  progress: number
  query: string
  onQueryChange: (value: string) => void
  matchCount: number
  activeIndex: number
  onPrevMatch: () => void
  onNextMatch: () => void
  tocCount: number
  tocOpen: boolean
  onToggleToc: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="border-b border-white/10 bg-white/[0.03]">
      <div className="h-1 w-full bg-white/[0.06]">
        <div className="h-full bg-ase-brand transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5">
        {tocCount > 1 ? (
          <button
            type="button"
            onClick={onToggleToc}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition',
              tocOpen ? 'bg-ase-brand/15 text-ase-brand' : 'text-ase-text2 hover:bg-white/[0.06] hover:text-ase-text',
            )}
          >
            <ListTree className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t('catalog.resource.viewer.toc')}
          </button>
        ) : null}
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('catalog.resource.viewer.searchPlaceholder') as string}
            className="w-full rounded-md border border-white/10 bg-black/20 py-1 pl-7 pr-2 text-[12px] text-ase-text outline-none focus-visible:border-ase-brand/50"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ase-muted hover:text-ase-text"
              aria-label={t('catalog.resource.viewer.clearSearch') as string}
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
        {query.trim() ? (
          <div className="flex shrink-0 items-center gap-1 text-[11px] text-ase-muted">
            <span className="tabular-nums">
              {matchCount > 0
                ? `${activeIndex + 1}/${matchCount}`
                : (t('catalog.resource.viewer.noMatches') as string)}
            </span>
            <button
              type="button"
              disabled={matchCount === 0}
              onClick={onPrevMatch}
              className="rounded-md p-1 transition hover:bg-white/[0.06] hover:text-ase-text disabled:opacity-40"
              aria-label={t('catalog.resource.viewer.prevMatch') as string}
            >
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={matchCount === 0}
              onClick={onNextMatch}
              className="rounded-md p-1 transition hover:bg-white/[0.06] hover:text-ase-text disabled:opacity-40"
              aria-label={t('catalog.resource.viewer.nextMatch') as string}
            >
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Side rail listing every h1-h4 in the document, tracking which section is
 * currently in view — clicking jumps there, hovering reveals a "copy this
 * section" action. Only rendered by the caller when there are ≥2 headings. */
export function TableOfContentsRail({
  toc,
  activeId,
  onJump,
  onCopySection,
  copiedId,
}: {
  toc: TocEntry[]
  activeId: string | null
  onJump: (id: string) => void
  onCopySection: (id: string) => void
  copiedId: string | null
}) {
  const { t } = useI18n()
  return (
    <nav className="hidden w-52 shrink-0 overflow-y-auto border-r border-white/10 bg-black/10 py-3 pl-1 pr-2 sm:block">
      <ul className="space-y-0.5">
        {toc.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: `${(entry.level - 1) * 10}px` }}>
            <div
              className={cn(
                'group flex items-center gap-1 rounded-md py-1 pl-2 pr-1 text-[12px] transition',
                entry.id === activeId ? 'bg-ase-brand/10 font-medium text-ase-brand' : 'text-ase-text2 hover:bg-white/[0.05] hover:text-ase-text',
              )}
            >
              <button type="button" onClick={() => onJump(entry.id)} className="min-w-0 flex-1 truncate text-left">
                {entry.text}
              </button>
              <button
                type="button"
                onClick={() => onCopySection(entry.id)}
                title={t('catalog.resource.viewer.copySection') as string}
                className="shrink-0 rounded p-0.5 opacity-0 transition hover:bg-white/[0.08] group-hover:opacity-100"
              >
                <Copy className="h-3 w-3" strokeWidth={1.75} />
              </button>
            </div>
            {copiedId === entry.id ? (
              <p className="pl-2 text-[10px] text-emerald-300">{t('catalog.resource.viewer.sectionCopied')}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}

