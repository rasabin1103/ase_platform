// Shared file-path header bar for the binary "Ver contenido" viewers
// (DocxViewer, XlsxViewer) — kept component-only (react-refresh requires
// this) so the byte-decoding helper lives in utils/base64.ts instead.

export function FileHeaderBar({ path }: { path: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
      <span className="truncate font-mono text-[11px] text-ase-muted">{path}</span>
    </div>
  )
}
