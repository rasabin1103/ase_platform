import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

// Matches any of the checkmark glyphs admins actually paste (✓ U+2713, ✔
// U+2714, ✅ U+2705, ☑ U+2611), each optionally followed by the emoji
// variation selector (U+FE0F) — e.g. "✔️". Two different checkmark styles
// showing up in the *same* text (a leading "✔" bullet plus a decorative
// "✅" mid-sentence) is exactly what real pasted content looks like, so all
// four are treated the same rather than betting on one specific glyph.
const CHECK_GLYPHS = '[✓✔✅☑]️?'
const LEADING_CHECK = new RegExp(`^\\s*${CHECK_GLYPHS}\\s*`)
const ANY_CHECK = new RegExp(CHECK_GLYPHS, 'g')

/** Some catalog descriptions get pasted as a checklist that isn't real
 * Markdown list syntax — either one dense run-on paragraph using a
 * checkmark as an inline separator, or (just as common when copying from a
 * doc) one checkmark-prefixed item per line without a blank line between
 * them, which Markdown treats as a single soft-wrapped paragraph rather
 * than separate list items. Both render as a wall of text. This detects
 * either shape and rewrites it into a real bullet list before handing it
 * to react-markdown, so it reads as a properly spaced list everywhere
 * regardless of how the admin pasted it in. Anything that already has real
 * block structure (headings, blank-line paragraphs, an existing list) is
 * left completely untouched. */
function normalizeChecklistText(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return source

  const hasBlockStructure = /\n\s*\n|(?:^|\n)#{1,6}\s|(?:^|\n)[-*]\s|(?:^|\n)\d+\.\s/.test(trimmed)
  if (hasBlockStructure) return source

  // Shape 1: already one item per line (real newlines), each starting with
  // a checkmark — just needs each line turned into a proper "- " bullet.
  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const checklistLineCount = lines.filter((line) => LEADING_CHECK.test(line)).length
  if (lines.length >= 2 && checklistLineCount >= Math.max(2, lines.length - 1)) {
    return lines.map((line) => `- ${line.replace(LEADING_CHECK, '')}`).join('\n')
  }

  // Shape 2: one run-on paragraph using a checkmark as an inline separator.
  const markerCount = (trimmed.match(ANY_CHECK) ?? []).length
  if (markerCount < 2) return source

  const items = trimmed
    .split(ANY_CHECK)
    .map((part) => part.trim())
    .filter(Boolean)
  if (items.length < 2) return source

  return items.map((item) => `- ${item}`).join('\n')
}

// Renders a resource's README.md as real formatted Markdown (headings,
// lists, tables, code blocks...) instead of raw text or syntax-highlighted
// source — this is always the entry point for "Ver contenido" now that a
// resource's repo_path points at a folder (README.md + packaged .zip)
// rather than a single file. Styled by hand against the site's dark theme
// since we don't have the Tailwind typography plugin available.
const MARKDOWN_COMPONENTS: Components = {
  h1: ({ className, ...props }) => (
    <h1 className={cn('mb-4 mt-6 text-2xl font-bold text-ase-text first:mt-0', className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn('mb-3 mt-6 border-b border-white/10 pb-1.5 text-xl font-bold text-ase-text first:mt-0', className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn('mb-2 mt-5 text-lg font-semibold text-ase-text', className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn('mb-2 mt-4 text-base font-semibold text-ase-text', className)} {...props} />
  ),
  p: ({ className, ...props }) => <p className={cn('mb-3 text-sm leading-relaxed text-ase-text2', className)} {...props} />,
  a: ({ className, ...props }) => (
    <a
      className={cn('text-ase-brand underline underline-offset-2 hover:text-ase-brand/80', className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  ul: ({ className, ...props }) => <ul className={cn('mb-4 ml-5 list-disc space-y-2 text-sm text-ase-text2', className)} {...props} />,
  ol: ({ className, ...props }) => <ol className={cn('mb-4 ml-5 list-decimal space-y-2 text-sm text-ase-text2', className)} {...props} />,
  li: ({ className, ...props }) => <li className={cn('pl-1 leading-relaxed', className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn('mb-3 border-l-2 border-ase-brand/40 pl-3 text-sm italic text-ase-muted', className)} {...props} />
  ),
  hr: ({ className, ...props }) => <hr className={cn('my-5 border-white/10', className)} {...props} />,
  strong: ({ className, ...props }) => <strong className={cn('font-semibold text-ase-text', className)} {...props} />,
  table: ({ className, ...props }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-white/10">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th className={cn('border-b border-white/10 bg-white/[0.04] px-3 py-1.5 text-left font-semibold text-ase-text', className)} {...props} />
  ),
  td: ({ className, ...props }) => <td className={cn('border-b border-white/[0.06] px-3 py-1.5 text-ase-text2', className)} {...props} />,
  img: ({ className, ...props }) => <img className={cn('my-3 max-w-full rounded-lg border border-white/10', className)} {...props} />,
  pre: ({ className, ...props }) => (
    <pre className={cn('mb-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[12px]', className)} {...props} />
  ),
  code: ({ className, ...props }) =>
    className ? (
      // Fenced code block — react-markdown wraps this inside <pre>, which
      // already carries the block styling above; this just sets the font.
      <code className={cn('font-mono text-ase-text2', className)} {...props} />
    ) : (
      // Inline `code span` — no className is how react-markdown v9+
      // distinguishes it from a fenced block.
      <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-amber-200" {...props} />
    ),
}

/** Bare Markdown rendering, no file-header chrome — for content that isn't
 * a specific repo file (e.g. a catalog item's own long_description), where
 * MarkdownViewer's path bar / copy button wouldn't make sense. Both use the
 * same MARKDOWN_COMPONENTS styling so a **bold** word or a list looks
 * identical everywhere in the catalog, regardless of which admin field it
 * came from. */
export function MarkdownContent({ content }: { content: string }) {
  const normalized = useMemo(() => normalizeChecklistText(content), [content])
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
      {normalized}
    </Markdown>
  )
}

export function MarkdownViewer({
  path,
  content,
  maximized,
}: {
  path: string
  content: string
  /** True while the parent Modal is toggled to fill the viewport — swaps
   * the inner scroll area to a taller cap so the extra room actually gets
   * used instead of leaving dead space around a still-70vh-capped box. */
  maximized?: boolean
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable/blocked (e.g. insecure context) — the
      // button just won't flip to "copied", nothing else to do about it.
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="truncate font-mono text-[11px] text-ase-muted">{path}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {copied ? t('catalog.resource.copied') : t('catalog.resource.copy')}
        </button>
      </div>
      <div className={cn('overflow-y-auto bg-black/20 px-6 py-5', maximized ? 'max-h-[80vh]' : 'max-h-[68vh]')}>
        <MarkdownContent content={content} />
      </div>
    </div>
  )
}
