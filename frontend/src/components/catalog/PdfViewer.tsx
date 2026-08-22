import { useEffect, useMemo } from 'react'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'
import { base64ToArrayBuffer } from '../../utils/base64'

// PDF -> native browser PDF viewer via an <iframe> pointed at a Blob object
// URL, for the "pdf" kind of the resource-content endpoint (see
// ConsumerCatalogService.get_resource_content). No pdf.js/react-pdf
// dependency: every browser this app targets (Chrome, Edge, Firefox,
// Safari) already ships a full PDF renderer, and an <iframe src> can't
// carry an Authorization header anyway — decoding the already-fetched
// base64 into a blob: URL client-side is both simpler and the only option.

export function PdfViewer({
  path,
  contentBase64,
  maximized,
  isPreview,
}: {
  path: string
  contentBase64: string
  maximized?: boolean
  /** True when this is a free sample (preview*.pdf) served to someone who
   * doesn't own the item yet, not the real file — see
   * ResourceContentRead.isPreview. Shows a "buy to see the rest" banner
   * instead of presenting it like full access. */
  isPreview?: boolean
}) {
  const { t } = useI18n()
  // Blob/createObjectURL is synchronous, so — same reasoning as XlsxViewer
  // using useMemo instead of an effect for its synchronous XLSX.read() —
  // this is a plain memo rather than state set from an effect body. The
  // effect below exists only to revoke the *previous* URL, which is a
  // legitimate cleanup-only effect (no setState in its body).
  const url = useMemo(() => {
    const blob = new Blob([base64ToArrayBuffer(contentBase64)], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }, [contentBase64])

  useEffect(() => {
    return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="truncate font-mono text-[11px] text-ase-muted">{path}</span>
        {isPreview ? (
          <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            {t('catalog.resource.previewBadge')}
          </span>
        ) : null}
      </div>
      {isPreview ? (
        <p className="border-b border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {t('catalog.resource.previewHint')}
        </p>
      ) : null}
      <div className={cn(maximized ? 'h-[82vh]' : 'h-[70vh]', 'bg-black/30')}>
        <iframe src={url} title={path} className="h-full w-full border-0" />
      </div>
    </div>
  )
}
