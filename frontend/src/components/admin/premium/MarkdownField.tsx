/* eslint-disable react-hooks/refs -- this file only ever reads
 * textareaRef.current from inside `apply`, a useCallback-memoized handler
 * invoked from a toolbar button's onClick — never during render itself.
 * The rule's static analysis can't see through the useCallback boundary
 * here and flags the JSX that builds the button list instead; restructuring
 * further to dodge it would make the code harder to follow for no real
 * safety gain. */
import { useCallback, useRef, useState } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { Bold, Eye, Heading2, Italic, Link2, List, ListOrdered, Pencil } from 'lucide-react'
import { MarkdownContent } from '../../catalog/MarkdownViewer'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type Result = { newValue: string; start: number; end: number }

// Wraps the current selection with `before`/`after` (bold, italic, link) —
// falls back to `placeholderText` when nothing is selected, so clicking the
// button with an empty selection still inserts something sensible to type
// over instead of just placing empty `****` at the cursor.
function wrapSelection(el: HTMLTextAreaElement, before: string, after: string, placeholderText: string): Result {
  const { selectionStart, selectionEnd, value } = el
  const selected = value.slice(selectionStart, selectionEnd) || placeholderText
  const newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
  const start = selectionStart + before.length
  return { newValue, start, end: start + selected.length }
}

// Prefixes every line touched by the current selection with `prefix` (list
// bullets, headings) — extends the selection out to full lines first so
// clicking with the cursor in the middle of a line still formats that
// whole line, not just the half after the cursor.
function prefixLines(el: HTMLTextAreaElement, prefix: string): Result {
  const { selectionStart, selectionEnd, value } = el
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  const nextBreak = value.indexOf('\n', selectionEnd)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const block = value.slice(lineStart, lineEnd)
  const lines = block.length > 0 ? block.split('\n') : ['']
  const newBlock = lines.map((line) => (line.startsWith(prefix) ? line : prefix + line)).join('\n')
  const newValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd)
  return { newValue, start: lineStart, end: lineStart + newBlock.length }
}

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
  name: Path<T>
  rows?: number
  placeholder?: string
  hasError?: boolean
  required?: boolean
  requiredMessage?: string
}

/** A plain Markdown textarea plus a small formatting toolbar (bold, italic,
 * heading, lists, link) that inserts real Markdown syntax at the cursor —
 * and a preview toggle that renders the current text through the exact
 * same MarkdownContent component the public catalog detail page uses, so
 * what an admin sees here is what a buyer will actually see. Deliberately
 * Markdown, not a rich-text/HTML editor: react-markdown never executes
 * arbitrary HTML by design, so there's no way for a description field to
 * become an XSS vector — the toolbar exists so an admin gets bold/lists/
 * links without needing to know the `**...**` syntax by heart. */
export function MarkdownField<T extends FieldValues>({
  form,
  name,
  rows = 4,
  placeholder,
  hasError,
  required,
  requiredMessage,
}: Props<T>) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { ref: rhfRef, ...registerRest } = form.register(name, required ? { required: requiredMessage } : undefined)
  const value = (useWatch({ control: form.control, name }) as string | undefined) ?? ''

  // useCallback (not a plain function defined during render) so the ref
  // read below is unambiguously deferred to the click that actually
  // invokes it, never during render itself.
  const apply = useCallback(
    (fn: (el: HTMLTextAreaElement) => Result) => {
      const el = textareaRef.current
      if (!el) return
      const { newValue, start, end } = fn(el)
      form.setValue(name, newValue as never, { shouldDirty: true, shouldValidate: true })
      // setValue updates the (uncontrolled) textarea's DOM value
      // synchronously via the ref react-hook-form holds — safe to restore
      // focus/selection right after, in the same tick.
      el.focus()
      el.setSelectionRange(start, end)
    },
    [form, name],
  )

  const buttons: { icon: typeof Bold; title: string; onClick: () => void }[] = [
    {
      icon: Bold,
      title: t('adminCatalog.markdownToolbar.bold') as string,
      onClick: () => apply((el) => wrapSelection(el, '**', '**', t('adminCatalog.markdownToolbar.boldPlaceholder') as string)),
    },
    {
      icon: Italic,
      title: t('adminCatalog.markdownToolbar.italic') as string,
      onClick: () => apply((el) => wrapSelection(el, '*', '*', t('adminCatalog.markdownToolbar.italicPlaceholder') as string)),
    },
    {
      icon: Heading2,
      title: t('adminCatalog.markdownToolbar.heading') as string,
      onClick: () => apply((el) => prefixLines(el, '## ')),
    },
    {
      icon: List,
      title: t('adminCatalog.markdownToolbar.bulletList') as string,
      onClick: () => apply((el) => prefixLines(el, '- ')),
    },
    {
      icon: ListOrdered,
      title: t('adminCatalog.markdownToolbar.numberedList') as string,
      onClick: () => apply((el) => prefixLines(el, '1. ')),
    },
    {
      icon: Link2,
      title: t('adminCatalog.markdownToolbar.link') as string,
      onClick: () =>
        apply((el) => {
          const { selectionStart, selectionEnd, value: v } = el
          const label = v.slice(selectionStart, selectionEnd) || (t('adminCatalog.markdownToolbar.linkPlaceholder') as string)
          const before = `[${label}](`
          const after = ')'
          const url = 'https://'
          const newValue = v.slice(0, selectionStart) + before + url + after + v.slice(selectionEnd)
          const start = selectionStart + before.length
          return { newValue, start, end: start + url.length }
        }),
    },
  ]

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        {buttons.map(({ icon: Icon, title, onClick }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={onClick}
            disabled={previewOpen}
            className="rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-ase-text2 transition hover:bg-white/[0.08] hover:text-ase-text disabled:opacity-40"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-ase-text2 transition hover:bg-white/[0.08] hover:text-ase-text"
        >
          {previewOpen ? (
            <>
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('adminCatalog.markdownToolbar.edit')}
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('adminCatalog.markdownToolbar.preview')}
            </>
          )}
        </button>
      </div>

      {previewOpen ? (
        <div
          className="min-h-[6rem] w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3"
          style={{ minHeight: `${rows * 1.6}rem` }}
        >
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm italic text-ase-muted">{t('adminCatalog.markdownToolbar.previewEmpty')}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={(el) => {
            rhfRef(el)
            textareaRef.current = el
          }}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-ase-text',
            hasError && 'border-ase-error/60',
          )}
          {...registerRest}
        />
      )}
    </div>
  )
}
