import { useEffect, useRef, useState } from 'react'
import * as mammoth from 'mammoth'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'
import { base64ToArrayBuffer } from '../../utils/base64'
import { FileHeaderBar } from './resourceViewerShared'
import { DocumentViewerToolbar, ResumedIndicator, TableOfContentsRail } from './DocumentViewerChrome'
import {
  getSectionText,
  useDocumentViewerChrome,
  useHeadingToc,
  useReadingProgress,
  useSavedScrollPosition,
  useTextSearch,
} from './documentViewerTools'

// .docx -> HTML via mammoth, entirely client-side, for the "docx" kind of
// the resource-content endpoint (see ConsumerCatalogService.get_resource_content).
// In its own file (and lazy-imported from CatalogDetailPage) so mammoth
// only ships to the browser when someone actually opens a .docx resource,
// instead of bloating every catalog item detail page's bundle.

type DocxResult = { key: string; html: string | null; error: boolean }

export function DocxViewer({
  path,
  contentBase64,
  maximized,
}: {
  path: string
  contentBase64: string
  maximized?: boolean
}) {
  const { t } = useI18n()
  // Keyed by the base64 payload that produced it — `result.key !==
  // contentBase64` means the current props haven't resolved yet (either
  // this is the first render, or a different file just replaced this one),
  // so "loading" is derived from that instead of being reset with a
  // separate setState call at the top of the effect.
  const [result, setResult] = useState<DocxResult>({ key: '', html: null, error: false })
  const contentRef = useRef<HTMLDivElement>(null)
  const chrome = useDocumentViewerChrome()

  useEffect(() => {
    let cancelled = false
    mammoth
      .convertToHtml({ arrayBuffer: base64ToArrayBuffer(contentBase64) })
      .then((converted) => {
        if (!cancelled) setResult({ key: contentBase64, html: converted.value, error: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: contentBase64, html: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [contentBase64])

  const isLoading = result.key !== contentBase64
  const html = isLoading ? null : result.html

  // Hooks must run unconditionally on every render (the error/loading
  // early-returns below happen after these), so each one tolerates a null
  // `html`/empty container and just produces an empty TOC/0 matches until
  // the mammoth conversion resolves.
  const { toc, activeId, jumpTo } = useHeadingToc(contentRef, html)
  const progress = useReadingProgress(contentRef)
  const wasResumed = useSavedScrollPosition(path || null, contentRef, html !== null)
  const resumedSection = toc.find((entry) => entry.id === activeId)?.text ?? null
  const { matchCount, activeIndex, goNext, goPrev } = useTextSearch(contentRef, chrome.query, html)

  const handleCopySection = async (id: string) => {
    const text = getSectionText(contentRef, id)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      chrome.flashCopied(id)
    } catch {
      // Clipboard API unavailable/blocked (e.g. insecure context) — the
      // section just won't flash "copied", nothing else to do about it.
    }
  }

  if (!isLoading && result.error) {
    return <p className="text-sm text-rose-300">{t('catalog.resource.renderError')}</p>
  }
  if (isLoading || html === null) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-white/5" />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <FileHeaderBar path={path} />
      {wasResumed ? <ResumedIndicator sectionText={resumedSection} /> : null}
      <DocumentViewerToolbar
        progress={progress}
        query={chrome.query}
        onQueryChange={chrome.setQuery}
        matchCount={matchCount}
        activeIndex={activeIndex}
        onPrevMatch={goPrev}
        onNextMatch={goNext}
        tocCount={toc.length}
        tocOpen={chrome.tocOpen}
        onToggleToc={() => chrome.setTocOpen((v) => !v)}
      />
      <div className="flex">
        {chrome.tocOpen && toc.length > 1 ? (
          <TableOfContentsRail
            toc={toc}
            activeId={activeId}
            onJump={jumpTo}
            onCopySection={handleCopySection}
            copiedId={chrome.copiedId}
          />
        ) : null}
        <div
          ref={contentRef}
          className={cn(
            'flex-1',
            maximized ? 'max-h-[82vh]' : 'max-h-[70vh]',
            'overflow-auto bg-black/20 px-6 py-5 text-sm leading-relaxed text-ase-text2',
            // Mammoth's output is plain, unstyled markup (h1/p/ul/table/...)
            // so it's styled here with Tailwind's descendant-selector
            // arbitrary variants, matching MarkdownViewer's look.
            '[&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-ase-text [&_h1]:first:mt-0',
            '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-1.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ase-text',
            '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ase-text',
            '[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-ase-text',
            '[&_p]:mb-3',
            '[&_a]:text-ase-brand [&_a]:underline [&_a]:underline-offset-2',
            '[&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2',
            '[&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2',
            '[&_li]:pl-1 [&_li]:leading-relaxed',
            '[&_strong]:font-semibold [&_strong]:text-ase-text',
            '[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-ase-brand/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ase-muted',
            '[&_table]:mb-4 [&_table]:min-w-full [&_table]:border-collapse [&_table]:text-sm',
            '[&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-white/10 [&_th]:bg-white/[0.04] [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ase-text',
            '[&_td]:border-b [&_td]:border-white/[0.06] [&_td]:px-4 [&_td]:py-2 [&_td]:align-top',
            '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-white/10',
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
