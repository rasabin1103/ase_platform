import { useEffect, useRef, useState, type RefObject } from 'react'

// Shared behavior for the three "Ver contenido" viewers (MarkdownViewer,
// DocxViewer, XlsxViewer's text-ish siblings) — table of contents with
// scroll-tracking, a reading-progress bar, remembering the last scroll
// position across visits, and an in-document text search with
// prev/next-match navigation. Each hook operates on a caller-supplied
// scrollable container ref so it works the same whether the content is
// react-markdown output or mammoth's raw HTML.

export type TocEntry = { id: string; text: string; level: number }

const HEADING_SELECTOR = 'h1, h2, h3, h4'

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'section'
}

/** Walks the container's headings, assigns each a stable, de-duplicated id
 * (skipping ones that already have one — mammoth/react-markdown never set
 * these, but this stays idempotent either way), and returns them in
 * document order. Call after the content has actually painted (a layout
 * effect keyed on the content itself, not on first mount only — a new
 * file replacing the old one needs a fresh pass). */
function collectHeadings(container: HTMLElement): TocEntry[] {
  const seen = new Set<string>()
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
  return nodes.map((node) => {
    let id = node.id
    if (!id) {
      const slug = slugify(node.textContent ?? '')
      let candidate = slug
      let n = 2
      while (seen.has(candidate)) {
        candidate = `${slug}-${n}`
        n += 1
      }
      id = candidate
      node.id = id
    }
    seen.add(id)
    const level = Number(node.tagName.slice(1)) || 1
    return { id, text: node.textContent ?? '', level }
  })
}

/** Table of contents + "which section is the reader currently in" — the
 * latter drives both the sidebar's active highlight and is exposed so
 * callers can persist it if they want. Re-scans whenever `contentKey`
 * changes (e.g. the raw markdown/html string), since the DOM headings
 * only exist after that content has rendered. */
export function useHeadingToc(containerRef: RefObject<HTMLElement | null>, contentKey: unknown) {
  const [toc, setToc] = useState<TocEntry[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const entries = collectHeadings(container)
    setToc(entries)
    setActiveId(entries[0]?.id ?? null)
    if (entries.length === 0) return

    const headingEls = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (observedEntries) => {
        // Topmost heading currently inside the "active band" (top 10%-20%
        // of the scroll container) wins — mirrors how most doc-site TOCs
        // decide which section you're reading.
        const visible = observedEntries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        const id = (topMost.target as HTMLElement).id
        if (id) setActiveId(id)
      },
      { root: container, rootMargin: '0px 0px -70% 0px', threshold: [0, 1] },
    )
    headingEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey])

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return { toc, activeId, jumpTo }
}

/** 0-100 scroll progress through the container — a thin bar at the top of
 * the viewer gives a persistent sense of "how much is left", which matters
 * once a resource's README or a book chapter runs to several screens. */
export function useReadingProgress(containerRef: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100))) : 100)
    }
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }
    update()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
    // Intentionally re-attaches on every render (containerRef.current isn't
    // itself reactive, and this content swaps components rather than
    // re-rendering in place) — cheap enough for a single scroll listener.
  })

  return progress
}

const POSITION_PREFIX = 'ase.doc_viewer_pos.'

/** Restores the reader's last scroll offset for this exact file (keyed by
 * its repo path, which is stable across sessions) on open, then keeps
 * saving it as they scroll — so reopening a long README/book chapter picks
 * up where they left off instead of always starting at the top. `ready`
 * gates restoration until the content has actually painted (there's
 * nothing to scroll to before then).
 *
 * Returns whether a saved position was actually applied on this mount, so
 * the caller can flash a one-time "resumed where you left off" indicator —
 * without it, the restore happens silently and a reader has no way to tell
 * it worked versus the file simply opening scrolled for no reason. */
export function useSavedScrollPosition(
  storageKey: string | null,
  containerRef: RefObject<HTMLElement | null>,
  ready: boolean,
): boolean {
  const restoredForKey = useRef<string | null>(null);
  const [wasRestored, setWasRestored] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !ready || !storageKey) return
    if (restoredForKey.current !== storageKey) {
      restoredForKey.current = storageKey
      const saved = window.localStorage.getItem(POSITION_PREFIX + storageKey)
      const parsed = saved ? Number(saved) : NaN
      if (Number.isFinite(parsed) && parsed > 0) {
        el.scrollTop = parsed
        // Deferred out of this synchronous effect body (same reasoning as
        // useTextSearch's queueMicrotask above) to avoid a same-commit
        // cascading render from the set-state-in-effect lint rule.
        queueMicrotask(() => setWasRestored(true))
      }
    }
    let timeout = 0
    const onScroll = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        window.localStorage.setItem(POSITION_PREFIX + storageKey, String(el.scrollTop))
      }, 400)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(timeout)
    }
  }, [containerRef, ready, storageKey])

  return wasRestored
}

const MARK_ATTR = 'data-doc-search'

function unwrapMarks(container: HTMLElement) {
  container.querySelectorAll(`mark[${MARK_ATTR}]`).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
  })
  container.normalize()
}

/** In-document search: highlights every case-insensitive match of `query`
 * inside the container as a `<mark>`, and lets the caller step through
 * them. Runs as a DOM pass over text nodes (a TreeWalker) rather than
 * re-rendering the content, so it works the same over react-markdown's
 * output and mammoth's raw HTML without either needing to know search
 * exists. Re-scans whenever the query or the underlying content changes. */
export function useTextSearch(containerRef: RefObject<HTMLElement | null>, query: string, contentKey: unknown) {
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const marksRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    unwrapMarks(container)
    marksRef.current = []
    const trimmed = query.trim()
    if (!trimmed) {
      // Deferred to a microtask: this effect performs real DOM mutation
      // (the mark unwrap above), which is a legitimate effect — but
      // eslint's react-hooks/set-state-in-effect rule still wants any
      // resulting setState to happen out of the synchronous effect body,
      // to avoid a same-commit cascading render.
      queueMicrotask(() => {
        setMatchCount(0)
        setActiveIndex(-1)
      })
      return
    }
    const needle = trimmed.toLowerCase()

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parentTag = node.parentElement?.tagName
        if (parentTag === 'SCRIPT' || parentTag === 'STYLE') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })
    const textNodes: Text[] = []
    let current = walker.nextNode()
    while (current) {
      textNodes.push(current as Text)
      current = walker.nextNode()
    }

    const marks: HTMLElement[] = []
    for (const textNode of textNodes) {
      const value = textNode.nodeValue ?? ''
      const lower = value.toLowerCase()
      if (!lower.includes(needle)) continue
      const frag = document.createDocumentFragment()
      let cursor = 0
      let idx = lower.indexOf(needle, cursor)
      while (idx !== -1) {
        if (idx > cursor) frag.appendChild(document.createTextNode(value.slice(cursor, idx)))
        const mark = document.createElement('mark')
        mark.setAttribute(MARK_ATTR, '')
        mark.className = 'ase-doc-search-mark'
        mark.textContent = value.slice(idx, idx + needle.length)
        frag.appendChild(mark)
        marks.push(mark)
        cursor = idx + needle.length
        idx = lower.indexOf(needle, cursor)
      }
      if (cursor < value.length) frag.appendChild(document.createTextNode(value.slice(cursor)))
      textNode.parentNode?.replaceChild(frag, textNode)
    }

    marksRef.current = marks
    if (marks[0]) {
      marks[0].classList.add('ase-doc-search-mark-active')
      marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    queueMicrotask(() => {
      setMatchCount(marks.length)
      setActiveIndex(marks.length > 0 ? 0 : -1)
    })
    return () => unwrapMarks(container)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, contentKey])

  const focusIndex = (nextIndex: number) => {
    const marks = marksRef.current
    if (marks.length === 0) return
    marks[activeIndex]?.classList.remove('ase-doc-search-mark-active')
    const normalized = ((nextIndex % marks.length) + marks.length) % marks.length
    marks[normalized]?.classList.add('ase-doc-search-mark-active')
    marks[normalized]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveIndex(normalized)
  }

  return {
    matchCount,
    activeIndex,
    goNext: () => focusIndex(activeIndex + 1),
    goPrev: () => focusIndex(activeIndex - 1),
  }
}

/** Bundles the toolbar + optional TOC rail state (search query, TOC
 * open/closed, "just copied a section" flash) so MarkdownViewer/DocxViewer
 * don't each re-implement this bookkeeping. Lives here rather than in
 * DocumentViewerChrome.tsx so that file stays component-only for Fast
 * Refresh. */
export function useDocumentViewerChrome() {
  const [query, setQuery] = useState('')
  const [tocOpen, setTocOpen] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const flashCopied = (id: string) => {
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
  }

  return { query, setQuery, tocOpen, setTocOpen, copiedId, flashCopied }
}

/** Copies one section's text — from `headingId` up to (but not including)
 * the next heading of equal-or-shallower level, or the end of the
 * container. Works purely off the rendered DOM, so it's the same
 * implementation for react-markdown's output and mammoth's HTML. */
export function getSectionText(containerRef: RefObject<HTMLElement | null>, headingId: string): string | null {
  const container = containerRef.current
  const heading = container?.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`)
  if (!container || !heading) return null
  const level = Number(heading.tagName.slice(1)) || 1
  const parts: string[] = [heading.textContent ?? '']
  let node: Element | null = heading.nextElementSibling
  while (node) {
    if (/^H[1-4]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level) break
    const text = node.textContent?.trim()
    if (text) parts.push(text)
    node = node.nextElementSibling
  }
  return parts.join('\n\n')
}
