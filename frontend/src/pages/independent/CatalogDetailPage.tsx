import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Code,
  Download,
  ExternalLink,
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
import { Suspense, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { AccessTargetType } from '../../api/access_requests.api'
import { buyOrCheckoutCatalogItem } from '../../api/catalogPurchaseFlow'
import {
  downloadResource,
  getBookDownloadFormats,
  getConsumerCatalogItem,
  getDownloadQuota,
  getResourceContent,
  getResourceDownloadInfo,
  toggleCatalogFavorite,
  type ResourceDownloadFormat,
} from '../../api/consumerCatalog.api'
import { getPlanSavings } from '../../api/plansCatalog.api'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import { AudiobookPlayer } from '../../components/catalog/AudiobookPlayer'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { CodeViewer } from '../../components/catalog/CodeViewer'
import { ImageCarousel } from '../../components/catalog/ImageCarousel'
import { MarkdownViewer } from '../../components/catalog/MarkdownViewer'
import { PlanSavingsModal } from '../../components/catalog/PlanSavingsModal'
import { PlatformAudiobookPlayer } from '../../components/catalog/PlatformAudiobookPlayer'
import { RatingWidget } from '../../components/catalog/RatingWidget'
import { ReviewWidget } from '../../components/catalog/ReviewWidget'
import { SeriesPanel } from '../../components/catalog/SeriesPanel'
import { ShareButton } from '../../components/catalog/ShareButton'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonAnchor } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cn } from '../../components/ui/cn'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { AcademyCatalogPanel } from '../../features/academy/AcademyCatalogPanel'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import type { CatalogItemType } from '../../types/catalog.types'
import { parseApiError } from '../../utils/apiError'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import {
  BulletList,
  CollapsibleDescription,
  DownloadPackagePanel,
  GettingStartedPanel,
  LicensePanel,
  VersionPanel,
} from './CatalogDetailPage.parts'
import { RESOURCE_KIND_META, TYPE_CATALOG_PATH, formatPrice, typeLabelKey } from './CatalogDetailPage.utils'
import { DocxViewer, PdfViewer, XlsxViewer } from './CatalogDetailPage.viewers'

export function CatalogDetailPage() {
  const { type, slug } = useParams<{ type: CatalogItemType; slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, language } = useI18n()
  const auth = useAuth()
  const qc = useQueryClient()
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  // The catalog list's "Vista previa" card button links here with
  // ?preview=1 (see CatalogItemCard/CatalogPremiumCard) instead of
  // duplicating the whole ownership-aware viewer in the card itself — the
  // modal below is only ever rendered when canViewResource is true, so
  // opening it up front for an item with nothing to show is harmless (the
  // wrapper condition just no-ops).
  const [viewerOpen, setViewerOpen] = useState(() => new URLSearchParams(window.location.search).get('preview') === '1')
  const [viewerMaximized, setViewerMaximized] = useState(false)
  const [audiobookOpen, setAudiobookOpen] = useState(false)
  const [audiobookMaximized, setAudiobookMaximized] = useState(false)
  const [planSavingsModalOpen, setPlanSavingsModalOpen] = useState(false)

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

  // "You could save on this" prompt: only worth fetching for a priced item
  // the user doesn't already own (isPurchased already covers plan-based
  // access, see permanently_owned_slugs_for_user) — otherwise there's
  // nothing to compare against. See PlanSavingsModal / get_plan_savings.
  const planSavingsQuery = useQuery({
    queryKey: ['plan-savings', slug],
    queryFn: () => getPlanSavings(slug!),
    enabled: Boolean(slug) && !isFree && !item?.isPurchased,
    staleTime: 60_000,
  })
  const hasPlanSavings = (planSavingsQuery.data?.length ?? 0) > 0

  const handleBuyClick = () => {
    if (hasPlanSavings) {
      setPlanSavingsModalOpen(true)
      return
    }
    buyMutation.mutate()
  }
  // hasResourceContent already accounts for ownership/plan access on the
  // backend (and lets a free — price 0 — item through with no purchase
  // needed at all), so no extra isPurchased check is needed here.
  const canViewResource = Boolean(item?.hasResourceContent)

  // Drop the ?preview=1 param once it's done its job (see viewerOpen's
  // initializer above) so a refresh or re-share of this URL doesn't force
  // the viewer open again.
  useEffect(() => {
    if (searchParams.get('preview') !== '1') return
    const next = new URLSearchParams(searchParams)
    next.delete('preview')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Mirrors ConsumerCatalogService._owns_resource: a free item needs no
  // purchase at all, a priced one needs isPurchased (which already covers
  // permanent purchases and live plan-based access). Someone who hasn't
  // bought a priced item only gets Buy + a preview via "View content" — no
  // audiobook, format downloads, or "buy printed" clutter for something
  // they don't own yet.
  const hasFullAccess = isFree || Boolean(item?.isPurchased)

  // File count / size / formats of the package — no ownership needed (see
  // getResourceDownloadInfo), so this can show up before purchase alongside
  // the license panel rather than only after buying.
  const downloadInfoQuery = useQuery({
    queryKey: ['consumer-catalog', slug, 'download-info'],
    queryFn: () => getResourceDownloadInfo(slug!),
    enabled: Boolean(slug) && Boolean(item?.hasResourceContent),
    staleTime: 5 * 60_000,
  })

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
  // Only items whose access comes solely from a plan subscription
  // (isPlanIncluded) ever draw from this shared quota — an outright
  // purchase is never rationed. Viewing/previewing stays unaffected either
  // way; this only ever gates the download buttons below.
  const quotaQuery = useQuery({
    queryKey: ['consumer-catalog', 'me', 'download-quota'],
    queryFn: getDownloadQuota,
    enabled: Boolean(item?.isPlanIncluded),
    staleTime: 60_000,
  })
  // Once this exact item has ever been downloaded before (this month or
  // any earlier one), it must stay freely re-downloadable regardless of
  // the plan's quota state — "repetición de descarga consume cuota: no"
  // applies forever, not just within the same calendar month (see
  // backend app.modules.plans.quota.has_ever_downloaded_item).
  const quotaExhausted = Boolean(
    item?.isPlanIncluded &&
    !item?.alreadyDownloaded &&
    quotaQuery.data &&
    !quotaQuery.data.unlimited &&
    (quotaQuery.data.remaining ?? 0) <= 0,
  )
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
                  {item.discountedPrice != null ? (
                    <span className="flex items-baseline gap-2">
                      <span className="text-lg font-normal text-ase-text-muted line-through">
                        {formatPrice(item.price, item.currency, t('catalog.free'))}
                      </span>
                      <span>{formatPrice(item.discountedPrice, item.currency, t('catalog.free'))}</span>
                    </span>
                  ) : (
                    formatPrice(item.price, item.currency, t('catalog.free'))
                  )}
                </div>
                {item.discountedPrice != null && item.discountPercent != null ? (
                  <p className="mt-1 text-xs font-medium text-ase-brand">
                    {String(t('catalog.resource.discountContext'))
                      .replace(
                        '{{planName}}',
                        (language === 'en' && auth.currentUser?.plan_name_en
                          ? auth.currentUser.plan_name_en
                          : auth.currentUser?.plan_name) ||
                          (t('catalog.resource.discountContextFallbackPlan') as string),
                      )
                      .replace('{{percent}}', String(item.discountPercent))}
                  </p>
                ) : null}
                {item.isPurchased ? (
                  <Badge className="mt-2 border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
                    {item.isPlanIncluded ? t('catalog.includedInPlan') : t('catalog.purchased')}
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
                  leftIcon={
                    item.isPurchased ? (
                      <Check className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                    )
                  }
                  disabled={buyMutation.isPending || item.isPurchased}
                  onClick={handleBuyClick}
                >
                  {item.isPurchased
                    ? item.isPlanIncluded
                      ? t('catalog.includedInPlan')
                      : t('catalog.purchased')
                    : t('catalog.buy')}
                </Button>
              ) : null}
              {item.previewUrl ? (
                <ButtonAnchor
                  href={item.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  leftIcon={<ExternalLink className="h-4 w-4" strokeWidth={1.75} />}
                >
                  {t('catalog.openPreview')}
                </ButtonAnchor>
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
                  <Button
                    variant="outline"
                    leftIcon={<Code className="h-4 w-4" strokeWidth={1.75} />}
                    onClick={() => setViewerOpen(true)}
                  >
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
                              bookFormatsQuery.data?.[format] === false ||
                              quotaExhausted
                            }
                            title={
                              quotaExhausted
                                ? (t('catalog.resource.downloadQuotaExhausted') as string)
                                : bookFormatsQuery.data?.[format] === false
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
                        disabled={downloadMutation.isPending || quotaExhausted}
                        title={quotaExhausted ? (t('catalog.resource.downloadQuotaExhausted') as string) : undefined}
                        onClick={() => downloadMutation.mutate(undefined)}
                      >
                        {t('catalog.resource.download')}
                      </Button>
                    )
                  ) : null}
                  {item.isPlanIncluded && quotaQuery.data && !quotaQuery.data.unlimited && !quotaExhausted ? (
                    <span className="basis-full text-xs text-ase-text2">
                      {String(t('catalog.resource.downloadsRemaining'))
                        .replace('{{remaining}}', String(quotaQuery.data.remaining ?? 0))
                        .replace('{{limit}}', String(quotaQuery.data.limit ?? 0))}
                    </span>
                  ) : null}
                  {quotaExhausted ? (
                    <span className="basis-full text-xs text-amber-300">
                      {t('catalog.resource.downloadQuotaExhausted')}
                    </span>
                  ) : null}
                  {downloadMutation.isError ? (
                    <span className="basis-full text-xs text-rose-300">{t('catalog.resource.downloadError')}</span>
                  ) : null}
                </>
              ) : null}
              <ShareButton
                title={title}
                text={shortDescription}
                url={typeof window !== 'undefined' ? window.location.href : ''}
              />
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

          {item.seriesName ? <SeriesPanel slug={item.slug} currentSlug={item.slug} /> : null}

          <CollapsibleDescription content={longDescription} t={t} />

          {catalogType === 'resource' ? <VersionPanel item={item} t={t} language={language} /> : null}

          {catalogType === 'resource' ? <GettingStartedPanel text={item.gettingStarted} t={t} /> : null}

          {item.academyCourseKey ? (
            <AcademyCatalogPanel
              courseKey={item.academyCourseKey}
              owned={item.isPurchased || Number(item.price) <= 0}
              t={t}
            />
          ) : null}

          <DownloadPackagePanel info={downloadInfoQuery.data} t={t} />

          <LicensePanel item={item} t={t} />

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
                aria-label={
                  (viewerMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string
                }
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
                <CodeViewer
                  path={contentQuery.data.path}
                  content={contentQuery.data.content}
                  maximized={viewerMaximized}
                />
              ) : contentQuery.data.content ? (
                <MarkdownViewer
                  path={contentQuery.data.path}
                  content={contentQuery.data.content}
                  maximized={viewerMaximized}
                />
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
                aria-label={
                  (audiobookMaximized ? t('catalog.resource.restore') : t('catalog.resource.maximize')) as string
                }
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

      <PlanSavingsModal
        open={planSavingsModalOpen}
        itemSlug={slug!}
        onClose={() => setPlanSavingsModalOpen(false)}
        onBuyAlone={() => {
          setPlanSavingsModalOpen(false)
          buyMutation.mutate()
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <BulletList
          title={t('catalog.benefits')}
          items={benefits}
          icon={<ListChecks className="h-4 w-4" strokeWidth={1.75} />}
        />
        <BulletList
          title={t('catalog.requirements')}
          items={requirements}
          icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
        />
        <BulletList
          title={t('catalog.included')}
          items={included}
          icon={<Package className="h-4 w-4" strokeWidth={1.75} />}
        />
      </div>
    </div>
  )
}
