import { lazy } from 'react'

// Lazy: mammoth (DocxViewer) and SheetJS (XlsxViewer) are only needed for
// resources whose "Ver contenido" turns out to be a .docx/.xlsx — loading
// them eagerly would ship both libraries on every catalog item detail page,
// including the vast majority that only ever show README.md.
export const DocxViewer = lazy(() =>
  import('../../components/catalog/DocxViewer').then((m) => ({ default: m.DocxViewer })),
)
export const XlsxViewer = lazy(() =>
  import('../../components/catalog/XlsxViewer').then((m) => ({ default: m.XlsxViewer })),
)
export const PdfViewer = lazy(() =>
  import('../../components/catalog/PdfViewer').then((m) => ({ default: m.PdfViewer })),
)
