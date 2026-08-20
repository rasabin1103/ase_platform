import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'
import { base64ToArrayBuffer } from '../../utils/base64'
import { FileHeaderBar } from './resourceViewerShared'

// .xlsx/.xls -> per-sheet tables via SheetJS, for the "xlsx" kind of the
// resource-content endpoint (see ConsumerCatalogService.get_resource_content).
// In its own file (and lazy-imported from CatalogDetailPage) so SheetJS
// only ships to the browser when someone actually opens a spreadsheet
// resource, instead of bloating every catalog item detail page's bundle.

type SheetTable = { name: string; rows: unknown[][] }

const MAX_RENDERED_ROWS = 1000

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
  const [activeIndex, setActiveIndex] = useState(0)

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

  if (sheets === null) {
    return <p className="text-sm text-rose-300">{t('catalog.resource.renderError')}</p>
  }

  // activeIndex may be stale after switching to a different file with
  // fewer sheets — clamp instead of needing an effect to reset it.
  const safeIndex = Math.min(activeIndex, sheets.length - 1)
  const active = sheets[safeIndex]
  const header = active?.rows[0] ?? []
  const body = (active?.rows.slice(1) ?? []).slice(0, MAX_RENDERED_ROWS)
  const rowsTruncated = (active?.rows.length ?? 0) - 1 > MAX_RENDERED_ROWS

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <FileHeaderBar path={path} />
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
      {rowsTruncated ? (
        <p className="border-b border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {t('catalog.resource.xlsxTruncatedRows')}
        </p>
      ) : null}
      <div className={cn(maximized ? 'max-h-[82vh]' : 'max-h-[70vh]', 'overflow-auto bg-black/20 px-3 py-3')}>
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
                {header.map((_, colIndex) => (
                  <td key={colIndex} className="whitespace-nowrap border-b border-white/[0.06] px-4 py-2 text-ase-text2">
                    {String(row[colIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
