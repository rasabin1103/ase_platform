import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as XLSX from 'xlsx'
import { Check, Copy, Search, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'
import { base64ToArrayBuffer } from '../../utils/base64'
import { FileHeaderBar } from './resourceViewerShared'
import { ResumedIndicator } from './DocumentViewerChrome'
import { useReadingProgress, useSavedScrollPosition } from './documentViewerTools'

// .xlsx/.xls -> per-sheet tables via SheetJS, for the "xlsx" kind of the
// resource-content endpoint (see ConsumerCatalogService.get_resource_content).
// In its own file (and lazy-imported from CatalogDetailPage) so SheetJS
// only ships to the browser when someone actually opens a spreadsheet
// resource, instead of bloating every catalog item detail page's bundle.

type SheetTable = { name: string; rows: unknown[][] }

const MAX_RENDERED_ROWS = 1000
const SHEET_INDEX_PREFIX = 'ase.doc_viewer_sheet.'

function rowMatches(row: unknown[], needle: string): boolean {
  return row.some((cell) => String(cell ?? '').toLowerCase().includes(needle))
}

/** Wraps every case-insensitive occurrence of `needle` in `text` with a
 * <mark> — cell-level equivalent of documentViewerTools's DOM-node search,
 * simpler here since each cell is already a plain string rather than
 * arbitrary rendered markup. */
function highlightCell(text: string, needle: string) {
  if (!needle) return text
  const lower = text.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let idx = lower.indexOf(needle)
  let key = 0
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(
      <mark key={key} className="ase-doc-search-mark">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    key += 1
    cursor = idx + needle.length
    idx = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

export function XlsxViewer({
  path,
  contentBase64,
  maximized,
}: {
  path: string
  contentBase64: string
  maximized?: boolean
}) {
  const { t } = useI18n()
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = path ? window.localStorage.getItem(SHEET_INDEX_PREFIX + path) : null
    return saved ? Number(saved) || 0 : 0
  })
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // XLSX.read/sheet_to_json are synchronous and fast enough for the
  // spreadsheet sizes this viewer targets (capped server-side at
  // _MAX_BINARY_BYTES), so this is a plain memo — no effect, no loading
  // state, no reset-on-prop-change bookkeeping needed.
  const sheets = useMemo<SheetTable[] | null>(() => {
    try {
      const workbook = XLSX.read(base64ToArrayBuffer(contentBase64), { type: 'array' })
      return workbook.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
          header: 1,
          blankrows: false,
          defval: '',
        }),
      }))
    } catch {
      return null
    }
  }, [contentBase64])

  const progress = useReadingProgress(scrollRef)
  const wasResumed = useSavedScrollPosition(path ? `${path}#${activeIndex}` : null, scrollRef, sheets !== null)

  useEffect(() => {
    if (path) window.localStorage.setItem(SHEET_INDEX_PREFIX + path, String(activeIndex))
  }, [path, activeIndex])

  if (sheets === null) {
    return <p className="text-sm text-rose-300">{t('catalog.resource.renderError')}</p>
  }

  // activeIndex may be stale after switching to a different file with
  // fewer sheets — clamp instead of needing an effect to reset it.
  const safeIndex = Math.min(activeIndex, sheets.length - 1)
  const active = sheets[safeIndex]
  const header = active?.rows[0] ?? []
  const needle = search.trim().toLowerCase()
  const allBody = active?.rows.slice(1) ?? []
  const filteredBody = needle ? allBody.filter((row) => rowMatches(row, needle)) : allBody
  const body = filteredBody.slice(0, MAX_RENDERED_ROWS)
  const rowsTruncated = filteredBody.length > MAX_RENDERED_ROWS

  const handleCopySheet = async () => {
    const rowsToCopy = [header, ...filteredBody]
    const tsv = rowsToCopy.map((row) => row.map((cell) => String(cell ?? '')).join('\t')).join('\n')
    try {
      await navigator.clipboard.writeText(tsv)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable/blocked — button just won't flip state.
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <FileHeaderBar path={path} />
      {wasResumed ? <ResumedIndicator sectionText={active?.name} /> : null}
      {sheets.length > 1 ? (
        <div className="flex flex-wrap gap-1 border-b border-white/10 bg-black/20 px-3 py-2">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition',
                index === safeIndex
                  ? 'bg-ase-brand/20 text-ase-brand'
                  : 'text-ase-text2 hover:bg-white/[0.06] hover:text-ase-text',
              )}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="h-1 w-full bg-white/[0.06]">
          <div className="h-full bg-ase-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catalog.resource.viewer.searchRowsPlaceholder') as string}
              className="w-full rounded-md border border-white/10 bg-black/20 py-1 pl-7 pr-2 text-[12px] text-ase-text outline-none focus-visible:border-ase-brand/50"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ase-muted hover:text-ase-text"
                aria-label={t('catalog.resource.viewer.clearSearch') as string}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleCopySheet}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
          >
            {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
            {copied ? t('catalog.resource.viewer.sheetCopied') : t('catalog.resource.viewer.copySheet')}
          </button>
        </div>
      </div>
      {rowsTruncated ? (
        <p className="border-b border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {t('catalog.resource.xlsxTruncatedRows')}
        </p>
      ) : null}
      <div ref={scrollRef} className={cn(maximized ? 'max-h-[82vh]' : 'max-h-[70vh]', 'overflow-auto bg-black/20 px-3 py-3')}>
        {needle && filteredBody.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ase-muted">{t('catalog.resource.viewer.noRowsMatch')}</p>
        ) : (
          <table className="min-w-full border-collapse text-sm">
            {header.length ? (
              <thead>
                <tr>
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap border-b border-white/10 bg-white/[0.04] px-4 py-2 text-left font-semibold text-ase-text"
                    >
                      {String(cell ?? '')}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {header.map((_, colIndex) => {
                    const cellText = String(row[colIndex] ?? '')
                    return (
                      <td key={colIndex} className="whitespace-nowrap border-b border-white/[0.06] px-4 py-2 text-ase-text2">
                        {needle ? highlightCell(cellText, needle) : cellText}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
