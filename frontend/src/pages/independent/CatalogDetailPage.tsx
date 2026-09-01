import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Suspense, lazy, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Code,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileWarning,
  FileX,
  Headphones,
  Heart,
  ListChecks,
  Maximize2,
  Minimize2,
  Package,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import { AudiobookPlayer } from '../../components/catalog/AudiobookPlayer'
import { PlatformAudiobookPlayer } from '../../components/catalog/PlatformAudiobookPlayer'
import type { AccessTargetType } from '../../api/access_requests.api'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  downloadResource,
  getBookDownloadFormats,
  getConsumerCatalogItem,
  getResourceContent,
  toggleCatalogFavorite,
  type ResourceDownloadFormat,
} from '../../api/consumerCatalog.api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { parseApiError } from '../../utils/apiError'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { ImageCarousel } from '../../components/catalog/ImageCarousel'
import { RatingWidget } from '../../components/catalog/RatingWidget'
import { ReviewWidget } from '../../components/catalog/ReviewWidget'
import { MarkdownContent, MarkdownViewer } from '../../components/catalog/MarkdownViewer'
import { CodeViewer } from '../../components/catalog/CodeViewer'
import { ShareButton } from '../../components/catalog/ShareButton'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import type { CatalogItemType } from '../../types/catalog.types'

// Lazy: mammoth (DocxViewer) and SheetJS (XlsxViewer) are only needed for
// resources whose "Ver contenido" turns out to be a .docx/.xlsx — loading
// them eagerly would ship both libraries on every catalog item detail page,
// including the vast majority that only ever show README.md.
const DocxViewer = lazy(() =>
  import('../../components/catalog/DocxViewer').then((m) => ({ default: m.DocxViewer })),
)
const XlsxViewer = lazy(() =>
  import('../../components/catalog/XlsxViewer').then((m) => ({ default: m.XlsxViewer })),
)
const PdfViewer = lazy(() =>
  import('../../components/catalog/PdfViewer').then((m) => ({ default: m.PdfViewer })),
)

// Small "what kind of file is this" chip shown above the viewer body — a
// premium touch that also doubles as a quick sanity check for the admin
// (does the folder actually contain what I expect?) without opening the
// file in a new tab.
const RESOURCE_KIND_META: Record<
  'markdown' | 'docx' | 'xlsx' | 'code' | 'pdf',
  { icon: typeof FileText; labelKey: string }
> = {
  markdown: { icon: FileText, labelKey: 'catalog.resource.kindMarkdown' },
  docx: { icon: FileText, labelKey: 'catalog.resource.kindDocx' },
  xlsx: { icon: FileSpreadsheet, labelKey: 'catalog.resource.kindXlsx' },
  code: { icon: Code, labelKey: 'catalog.resource.kindCode' },
  pdf: { icon: FileText, labelKey: 'catalog.resource.kindPdf' },
}

const TYPE_CATALOG_PATH: Record<CatalogItemType, string> = {
  product: '/catalog/products',
  course: '/catalog/courses',
  book: '/catalog/books',
  resource: '/catalog/resources',
}

function typeLabelKey(type: CatalogItemType): string {
  const map: Record<CatalogItemType, string> = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  }
  return map[type]
}

function formatPrice(price: string | number, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function BulletList({
  title,
  items,
  icon,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
}) {
  if (!items.length) return null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          {icon}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-ase-text2">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ase-brand/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CatalogDetailPage() {
  const { type, slug } = useParams<{ type: CatalogItemType; slug: string }>()
  const { t, language } = useI18n()
  const qc = useQueryClient()
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMaximized, setViewerMaximized] = useState(false)
  const [audiobookOpen, setAudiobookOpen] = useState(false)
  const [audiobookMaximized, setAudiobookMaximized] = useState(false)

  const query = useQuery({
    queryKey: ['consumer-catalog', slug],
    queryFn: () => getConsumerCatalogItem(slug!),
    enabled: Boolean(slug),
  })

  // Checkout now opens in a new tab (buyOrCheckoutCatalogItem), so this tab
  // never navigates away and never reloads on its own — without this, an
  // item bought in the other tab would keep showing "Comprar" here until a
  // manual refresh. Re-checking whenever the user comes back to this tab
  // (switching back, or closing the checkout tab) picks up the purchase as
  // soon as the webhook has granted it, with no extra UI needed. Harmless
  // to run for an already-purchased or still-loading item — invalidate
  // just marks the query stale, it only refetches while this tab is
  // mounted and visible.
  useEffect(() => {
    if (!slug) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        qc.invalidateQueries({ queryKey: ['consumer-catalog', slug] })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [slug, qc])

  const favMutation = useMutation({
    mutationFn: () => toggleCatalogFavorite(slug!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumer-catalog', slug] }),
  })

  const buyMutation = useMutation({
    mutationFn: () => buyOrCheckoutCatalogItem(slug!, query.data?.price, language),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consumer-catalog', slug] }),
  })

  const item = query.data
  const isFree = Boolean(item) && !Number(item!.price)
  // hasResourceContent already accounts for ownership/plan access on the
  // backend (and lets a free — price 0 — item through with no purchase
  // needed at all), so no extra isPurchased check is needed here.
  const canViewResource = Boolean(item?.hasResourceContent)
  // Mirrors ConsumerCatalogService._owns_resource: a free item needs no
  // purchase at all, a priced one needs isPurchased (which already covers
  // permanent purchases and live plan-based access). Someone who hasn't
  // bought a priced item only gets Buy + a preview via "View content" — no
  // audiobook, format downloads, or "buy printed" clutter for something
  // they don't own yet.
  const hasFullAccess = isFree || Boolean(item?.isPurchased)

  const contentQuery = useQuery({
    queryKey: ['consumer-catalog', slug, 'resource-content'],
    queryFn: () => getResourceContent(slug!),
    enabled: Boolean(slug) && viewerOpen && canViewResource,
  })

  const downloadMutation = useMutation({
    mutationFn: (format?: ResourceDownloadFormat) => downloadResource(slug!, format),
  })
  // Powers the disabled state of the per-format download buttons — a book
  // can offer any subset of pdf/epub/kindle/zip, and clicking one that was
  // never uploaded should look disabled from the start rather than only
  // failing after the click. No ownership required to check this (see
  // ConsumerCatalogService.get_book_download_formats), so it's safe to run
  // for a non-owner too.
  const bookFormatsQuery = useQuery({
    queryKey: ['consumer-catalog', slug, 'download-formats'],
    queryFn: () => getBookDownloadFormats(slug!),
    enabled: Boolean(slug) && (type ?? item?.type) === 'book' && canViewResource,
  })
  const backPath = type && TYPE_CATALOG_PATH[type] ? TYPE_CATALOG_PATH[type] : '/dashboard'

  if (query.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (query.isError || !item) {
    return <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
  }

  const benefits = item.benefits ?? []
  const requirements = item.requirements ?? []
  const included = item.includedItems ?? []
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const shortDescription = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)
  const longDescription = localizedCatalogText(language, item.longDescription, item.longDescriptionEn)
  const catalogType = (type ?? item.type) as CatalogItemType
  const targetType = catalogType as AccessTargetType
  const showDemo = catalogType === 'product' || catalogType === 'course'

  return (
    <div className="space-y-8">
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ase-text2 transition hover:text-ase-text"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {t('catalog.backToCatalog')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <ImageCarousel
            images={item.images ?? []}
            fallbackUrl={item.imageUrl}
            fit="contain"
            zoomable
            aspectClassName={cn('border border-white/10', catalogImageAspectClass(catalogType))}
            overlay={
              <>
                {catalogType === 'book' ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-3"
                      style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-3 w-px bg-white/20" />
                  </>
                ) : null}
                <span className="absolute left-4 top-4 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text">
                  {t(typeLabelKey(catalogType))}
                </span>
              </>
            }
          />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
            <h1 className="mt-1.5 text-3xl font-bold text-ase-text">{title}</h1>
            <p className="mt-2 text-sm text-ase-muted">
              {t('catalog.author')}: {item.author}
              {item.duration ? ` · ${t('catalog.duration')}: ${item.duration}` : ''}
              {item.level ? ` · ${t('catalog.level')}: ${t(`catalog.levels.${item.level}`)}` : ''}
            </p>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-extrabold text-ase-text">
                  {formatPrice(item.price, item.currency, t('catalog.free'))}
                </div>
                {item.isPurchased ? (
                  <Badge className="mt-2 border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
                    {t('catalog.purchased')}
                  </Badge>
                ) : null}
              </div>
              <button
                type="button"
                disabled={favMutation.isPending}
                onClick={() => favMutation.mutate()}
                aria-label={item.isFavorite ? t('catalog.removeFavorite') : t('catalog.addFavorite')}
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition',
                  item.isFavorite
                    ? 'border-rose-400/50 bg-rose-500/15 text-rose-200'
                    : 'border-white/15 bg-white/[0.04] text-ase-text2 hover:text-ase-text',
                )}
              >
                <Heart className="h-5 w-5" strokeWidth={1.75} fill={item.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {!isFree ? (
                <Button
                  variant={item.isPurchased ? 'success' : 'primary'}
                  leftIcon={item.isPurchased ? <Check className="h-4 w-4" strokeWidth={2} /> : <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />}
                  disabled={buyMutation.isPending || item.isPurchased}
                  onClick={() => buyMutation.mutate()}
                >
                  {item.isPurchased ? t('catalog.purchased') : t('catalog.buy')}
                </Button>
              ) : null}
              {item.previewUrl ? (
                <a href={item.previewUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" strokeWidth={1.75} />}>
                    {t('catalog.openPreview')}
                  </Button>
                </a>
              ) : null}
              {hasFullAccess && (item.audiobookUrl || (catalogType === 'book' && canViewResource)) ? (
                <Button
                  variant="outline"
                  leftIcon={<Headphones className="h-4 w-4" strokeWidth={1.75} />}
                  onClick={() => setAudiobookOpen(true)}
                >
                  {t('catalog.resource.audiobook')}
                </Button>
              ) : null}
              {canViewResource ? (
                <>
                  <Button variant="outline" leftIcon={<Code className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setViewerOpen(true)}>
                    {hasFullAccess ? t('catalog.resource.viewContent') : t('catalog.resource.viewPreview')}
                  </Button>
                  {hasFullAccess ? (
                    catalogType === 'book' ? (
                      <>
                        {(['pdf', 'epub', 'kindle', 'zip'] as const).map((format) => (
                          <Button
                            key={format}
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" strokeWidth={1.75} />}
                            disabled={
                              (downloadMutation.isPending && downloadMutation.variables === format) ||
                              bookFormatsQuery.data?.[format] === false
                            }
                            title={
                              bookFormatsQuery.data?.[format] === false
                                ? (t('catalog.resource.formatUnavailable') as string)
                                : undefined
                            }
                            onClick={() => downloadMutation.mutate(format)}
                          >
                            {t(`catalog.resource.downloadFormat.${format}`)}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Truck className="h-4 w-4" strokeWidth={1.75} />}
                          disabled
                          title={t('catalog.resource.buyPrintedComingSoon') as string}
                        >
                          {t('catalog.resource.buyPrinted')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        leftIcon={<Download className="h-4 w-4" strokeWidth={1.75} />}
                        disabled={downloadMutation.isPending}
                        onClick={() => downloadMutation.mutate(undefined)}
                      >
                        {t('catalog.resource.download')}
                      </Button>
                    )
                  ) : null}
                  {downloadMutation.isError ? (
                    <span className="basis-full text-xs text-rose-300">{t('catalog.resource.downloadError')}</span>
                  ) : null}
                </>
              ) : null}
              <ShareButton title={title} text={shortDescription} url={typeof window !== 'undefined' ? window.location.href : ''} />
            </div>

            {!item.isPurchased ? (
              <div className="mt-3 flex flex-wrap gap-2.5 border-t border-white/[0.06] pt-3">
                <Button variant="ghost" size="sm" onClick={() => setAccessModalOpen(true)}>
                  {t('catalog.requestAccess')}
                </Button>
                {showDemo ? (
                  <Button variant="ghost" size="sm" onClick={() => setDemoModalOpen(true)}>
                    {t('catalog.requestDemo')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>

          <MarkdownContent content={longDescription} />

          <Card className="p-5">
            <RatingWidget item={item} />
          </Card>

          <Card className="p-5">
            <ReviewWidget item={item} />
          </Card>
        </div>
      </div>

      <AccessRequestModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['my-access-requests'] })}
        requestType="product_access"
        targetType={targetType}
        targetId={item.slug}
        title={`${t('catalog.requestAccessTitle')}: ${title}`}
        modalTitle={t('catalog.requestAccess')}
      />
      {showDemo ? (
        <AccessRequestModal
          open={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['my-access-requests'] })}
          requestType="demo_access"
          targetType={targetType}
          targetId={item.slug}
          title={`${t('catalog.requestDemoTitle')}: ${title}`}
          modalTitle={t('catalog.requestDemo')}
        />
      ) : null}

      {canViewResource ? (
        <Modal
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false)
            setViewerMaximized(false)
          }}
          title={
            // items-start + break-all (not truncate): a long repo path
            // (e.g. resources/skills/claude/ASE_QA-Strategy-v1.0/readme.md)
            // now wraps onto a second line instead of being cut off — and
            // the maximize button stays shrink-0 in its own slot so it
            // never moves or shrinks regardless of how many lines the path
            // takes.
            <div className="flex min-w-0 items-start gap-2">
              <span className="min-w-0 break-all">
                {`${t('catalog.resource.modalTitle')} · ${contentQuery.data?.path ?? title}`}
              </span>
              <button
                type="button"
                onClick={() => setViewerMaximized((prev) => !prev)}
                aria-label={(viewerMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string}
                title={(viewerMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string}
                className="flex shrink-0 items-center rounded-md p-1.5 text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
              >
                {viewerMaximized ? (
                  <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          }
          closeLabel={t('catalog.resource.close')}
          className={viewerMaximized ? 'h-[92vh] w-[96vw] max-w-none' : 'max-w-6xl'}
          // Modal already renders its own maximize toggle by default — this
          // title has its own (next to the file path, wired to
          // viewerMaximized so it also resizes the DocxViewer/XlsxViewer/
          // PdfViewer/MarkdownViewer scroll area below, not just the outer
          // dialog frame). Without this, both showed up side by side.
          allowFullscreen={false}
        >
          {contentQuery.isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : contentQuery.isError ? (
            <EmptyState
              icon={<FileWarning className="h-5 w-5" strokeWidth={1.75} />}
              title={t('catalog.resource.loadError') as string}
              description={`${parseApiError(contentQuery.error, t('catalog.resource.loadError') as string).message} ${t('catalog.resource.loadErrorHint')}`}
              actionLabel={t('catalog.resource.download') as string}
              onAction={() => downloadMutation.mutate(undefined)}
            />
          ) : contentQuery.data ? (
            <div className="space-y-3">
              {(() => {
                const meta = RESOURCE_KIND_META[contentQuery.data.kind]
                const KindIcon = meta.icon
                return (
                  <Badge variant="info" className="w-fit items-center gap-1.5">
                    <KindIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t(meta.labelKey)}
                  </Badge>
                )
              })()}
              {contentQuery.data.truncated ? (
                <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  {t('catalog.resource.truncated')}
                </p>
              ) : null}
              {contentQuery.data.kind === 'docx' && contentQuery.data.contentBase64 ? (
                <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                  <DocxViewer
                    path={contentQuery.data.path}
                    contentBase64={contentQuery.data.contentBase64}
                    maximized={viewerMaximized}
                  />
                </Suspense>
              ) : contentQuery.data.kind === 'xlsx' && contentQuery.data.contentBase64 ? (
                <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                  <XlsxViewer
                    path={contentQuery.data.path}
                    contentBase64={contentQuery.data.contentBase64}
                    maximized={viewerMaximized}
                  />
                </Suspense>
              ) : contentQuery.data.kind === 'pdf' && contentQuery.data.contentBase64 ? (
                <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                  <PdfViewer
                    path={contentQuery.data.path}
                    contentBase64={contentQuery.data.contentBase64}
                    maximized={viewerMaximized}
                    isPreview={contentQuery.data.isPreview}
                  />
                </Suspense>
              ) : contentQuery.data.kind === 'code' && contentQuery.data.content ? (
                <CodeViewer path={contentQuery.data.path} content={contentQuery.data.content} maximized={viewerMaximized} />
              ) : contentQuery.data.content ? (
                <MarkdownViewer path={contentQuery.data.path} content={contentQuery.data.content} maximized={viewerMaximized} />
              ) : (
                <EmptyState
                  icon={<FileX className="h-5 w-5" strokeWidth={1.75} />}
                  title={t('catalog.resource.empty') as string}
                  description={t('catalog.resource.emptyHint') as string}
                />
              )}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {item.audiobookUrl || (catalogType === 'book' && canViewResource) ? (
        <Modal
          open={audiobookOpen}
          onClose={() => {
            setAudiobookOpen(false)
            setAudiobookMaximized(false)
          }}
          title={
            <div className="flex min-w-0 items-start gap-2">
              <span className="min-w-0 break-all">{t('catalog.resource.audiobook')}</span>
              <button
                type="button"
                onClick={() => setAudiobookMaximized((prev) => !prev)}
                aria-label={(audiobookMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string}
                title={(audiobookMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string}
                className="flex shrink-0 items-center rounded-md p-1.5 text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
              >
                {audiobookMaximized ? (
                  <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          }
          closeLabel={t('catalog.resource.close')}
          className={audiobookMaximized ? 'h-[92vh] w-[96vw] max-w-none' : 'max-w-3xl'}
        >
          {item.audiobookUrl ? (
            <AudiobookPlayer url={item.audiobookUrl} coverUrl={item.imageUrl} maximized={audiobookMaximized} />
          ) : (
            <PlatformAudiobookPlayer slug={item.slug} coverUrl={item.imageUrl} maximized={audiobookMaximized} />
          )}
        </Modal>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <BulletList title={t('catalog.benefits')} items={benefits} icon={<ListChecks className="h-4 w-4" strokeWidth={1.75} />} />
        <BulletList title={t('catalog.requirements')} items={requirements} icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />} />
        <BulletList title={t('catalog.included')} items={included} icon={<Package className="h-4 w-4" strokeWidth={1.75} />} />
      </div>
    </div>
  )
}



