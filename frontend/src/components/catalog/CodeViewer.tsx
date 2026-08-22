import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

// Plain-text/script preview for the "code" kind of the resource-content
// endpoint (see ConsumerCatalogService.get_resource_content's final
// fallback) — line numbers + a lightweight, dependency-free tokenizer for
// comments/strings/numbers/keywords. No syntax-highlighting library is
// installed in this project (mammoth/xlsx were already a meaningful bundle
// cost for their own viewers), so this trades exhaustive per-language
// grammar accuracy for "no new dependency, still genuinely readable" — good
// enough for previewing a script before downloading it, which is the actual
// job here.

const EXTENSION_LANGUAGE: Record<string, string> = {
  py: 'Python',
  ipynb: 'Jupyter Notebook',
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  ps1: 'PowerShell',
  bat: 'Batch',
  cmd: 'Batch',
  rb: 'Ruby',
  go: 'Go',
  java: 'Java',
  kt: 'Kotlin',
  php: 'PHP',
  c: 'C',
  h: 'C',
  cpp: 'C++',
  hpp: 'C++',
  cs: 'C#',
  rs: 'Rust',
  swift: 'Swift',
  r: 'R',
  pl: 'Perl',
  lua: 'Lua',
  scala: 'Scala',
  sql: 'SQL',
  graphql: 'GraphQL',
  proto: 'Protocol Buffers',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  jsonc: 'JSON',
  toml: 'TOML',
  ini: 'INI',
  cfg: 'Config',
  conf: 'Config',
  env: 'Env',
  txt: 'Text',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  xml: 'XML',
  dockerfile: 'Dockerfile',
  gitignore: 'Git',
  editorconfig: 'Config',
}

function detectLanguage(path: string): string {
  const fileName = path.split('/').pop() ?? path
  const lower = fileName.toLowerCase()
  if (lower === 'dockerfile' || lower === 'makefile') return lower === 'dockerfile' ? 'Dockerfile' : 'Makefile'
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : ''
  return EXTENSION_LANGUAGE[ext] ?? 'Text'
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'elif', 'for', 'while', 'def', 'class',
  'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch', 'except', 'finally',
  'new', 'this', 'self', 'public', 'private', 'protected', 'static', 'void', 'int', 'str', 'float',
  'bool', 'true', 'false', 'null', 'none', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is',
  'switch', 'case', 'break', 'continue', 'throw', 'raise', 'with', 'as', 'lambda', 'yield',
  'interface', 'type', 'enum', 'extends', 'implements', 'package', 'namespace', 'using', 'echo',
  'print', 'struct', 'impl', 'fn', 'pub', 'mod', 'use', 'match', 'do', 'end', 'begin', 'then',
  'local', 'global', 'select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'table', 'join',
])

// Order matters: comments win over strings/numbers/keywords that happen to
// appear after a `#`/`//` on the same line; strings win over keywords that
// happen to appear inside quotes.
const TOKEN_RE =
  /(\/\/.*|#.*)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g

function highlightLine(line: string, lineKey: string) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  let tokenIndex = 0
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index))
    const [full, comment, string_, number, word] = match
    const key = `${lineKey}-${tokenIndex++}`
    if (comment !== undefined) {
      nodes.push(
        <span key={key} className="text-ase-muted/70 italic">
          {comment}
        </span>,
      )
    } else if (string_ !== undefined) {
      nodes.push(
        <span key={key} className="text-emerald-300/90">
          {string_}
        </span>,
      )
    } else if (number !== undefined) {
      nodes.push(
        <span key={key} className="text-amber-300/90">
          {number}
        </span>,
      )
    } else if (word !== undefined && KEYWORDS.has(word)) {
      nodes.push(
        <span key={key} className="text-sky-300/90 font-medium">
          {word}
        </span>,
      )
    } else {
      nodes.push(full)
    }
    lastIndex = match.index + full.length
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex))
  return nodes
}

const MAX_RENDERED_LINES = 5000

export function CodeViewer({
  path,
  content,
  maximized,
}: {
  path: string
  content: string
  maximized?: boolean
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const language = useMemo(() => detectLanguage(path), [path])
  const lines = useMemo(() => content.split('\n'), [content])
  const rendered = lines.slice(0, MAX_RENDERED_LINES)
  const linesTruncated = lines.length > MAX_RENDERED_LINES
  // Gutter width needs to fit the largest line number without reflowing as
  // you scroll past e.g. line 999 -> 1000.
  const gutterChars = String(rendered.length).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable/blocked — button just won't flip to "copied".
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-[11px] text-ase-muted">{path}</span>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ase-text2">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {copied ? t('catalog.resource.copied') : t('catalog.resource.copy')}
        </button>
      </div>
      {linesTruncated ? (
        <p className="border-b border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {t('catalog.resource.codeTruncatedLines')}
        </p>
      ) : null}
      <div className={cn(maximized ? 'max-h-[82vh]' : 'max-h-[70vh]', 'overflow-auto bg-black/30')}>
        <pre className="min-w-full px-0 py-3 font-mono text-[12.5px] leading-relaxed">
          <code>
            {rendered.map((line, i) => (
              <Fragment key={i}>
                <span className="inline-flex w-full">
                  <span
                    className="sticky left-0 shrink-0 select-none border-r border-white/[0.06] bg-black/30 px-3 text-right text-ase-muted/60"
                    style={{ minWidth: `${gutterChars + 2}ch` }}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-pre px-4 text-ase-text2">{highlightLine(line, String(i))}</span>
                </span>
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
