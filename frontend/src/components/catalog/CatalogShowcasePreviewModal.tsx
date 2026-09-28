import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileX } from 'lucide-react'
import type { CatalogItemType } from '../../api/catalogShowcase.api'
import { getCatalogShowcasePreviewContent } from '../../api/catalogShowcase.api'
import { Modal } from '../ui/Modal'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useI18n } from '../../i18n'
import { MarkdownContent } from './MarkdownViewer'

// PdfViewer only needs base64->blob + an <iframe>, nothing auth-specific —
// same component the authenticated resource viewer uses (see
// CatalogDetailPage.tsx), lazy-loaded here for the same reason: no need to
// pay for it unless someone actually opens a book's preview.
const PdfViewer = lazy(() => import('./PdfViewer').then((m) => ({ default: m.PdfViewer })))

/** The public, unauthenticated "view sample" modal — fetches the real
 * repo-backed preview file (a book's "preview" subfolder, or another
 * item's README.md; see backend get_public_preview_content) for a fully
 * anonymous visitor. Deliberately NOT wired to the `previewUrl` field —
 * that's a separate, optional external link the admin can set. */
export function CatalogShowcasePreviewModal({
  open,
  onClose,
  itemType,
  slug,
  title,
}: {
  open: boolean
  onClose: () => void
  itemType: CatalogItemType
  slug: string
  title: string
}) {
  const { t } = useI18n()

  const query = useQuery({
    queryKey: ['catalog-showcase-preview', itemType, slug],
    queryFn: () => getCatalogShowcasePreviewContent(itemType, slug),
    enabled: open,
    retry: false,
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('publicCatalogShowcase.previewModal.title')} · ${title}`}
      className="max-w-4xl"
    >
      {query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : query.isError ? (
        <EmptyState
          icon={<FileX className="h-5 w-5" strokeWidth={1.75} />}
          title={t('publicCatalogShowcase.previewModal.notAvailable') as string}
          description={t('publicCatalogShowcase.previewModal.notAvailableHint') as string}
        />
      ) : query.data ? (
        <div className="space-y-3">
          {query.data.kind === 'pdf' && query.data.contentBase64 ? (
            <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
              <PdfViewer path={query.data.path} contentBase64={query.data.contentBase64} isPreview />
            </Suspense>
          ) : query.data.content ? (
            <MarkdownContent content={query.data.content} />
          ) : (
            <EmptyState
              icon={<FileX className="h-5 w-5" strokeWidth={1.75} />}
              title={t('publicCatalogShowcase.previewModal.notAvailable') as string}
              description={t('publicCatalogShowcase.previewModal.notAvailableHint') as string}
            />
          )}
        </div>
      ) : null}
    </Modal>
  )
}
