import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Download, ExternalLink, LifeBuoy, ReceiptText } from 'lucide-react'
import {
  downloadResource,
  getMyPurchaseDetail,
  listMyPurchases,
  type MyPurchase,
} from '../../api/consumerCatalog.api'
import { createSuggestion } from '../../api/suggestions.api'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

function formatDate(iso: string, language: 'en' | 'es') {
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'es-ES', { dateStyle: 'medium' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function paymentStatusTone(status: string | null): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'paid') return 'success'
  if (status === 'unpaid') return 'warning'
  if (status === 'unknown') return 'warning'
  return 'default'
}

/** "Mis compras" — the transaction record, deliberately separate from "Mi
 * biblioteca" (what you can open, see MyLibraryPage). Each row keeps the
 * item summary the library already shows, plus a lazily-fetched "más
 * información" panel with the purchase's own facts: date, price paid,
 * discount, method, invoice, payment status, and acquired version. */
export function MyPurchasesPage() {
  const { t, language } = useI18n()
  const qc = useQueryClient()
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [pendingDownloadSlug, setPendingDownloadSlug] = useState<string | null>(null)
  const [supportTarget, setSupportTarget] = useState<MyPurchase | null>(null)

  const query = useQuery({ queryKey: ['my-purchases'], queryFn: listMyPurchases })
  const purchases = query.data?.items ?? []

  const detailQuery = useQuery({
    queryKey: ['my-purchase-detail', expandedSlug],
    queryFn: () => getMyPurchaseDetail(expandedSlug!),
    enabled: Boolean(expandedSlug),
  })

  const downloadMutation = useMutation({
    mutationFn: (slug: string) => downloadResource(slug),
    onMutate: (slug) => setPendingDownloadSlug(slug),
    onSettled: () => setPendingDownloadSlug(null),
  })

  const supportMutation = useMutation({
    mutationFn: (message: string) => createSuggestion(message, 'platform'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-suggestions'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ase-text">{t('catalog.pages.purchases.title')}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t('catalog.pages.purchases.subtitle')}</p>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.myPurchases.loadError')} />
      ) : purchases.length === 0 ? (
        <EmptyState title={t('catalog.myPurchases.empty')} description={t('catalog.myPurchases.emptyHint')} />
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const { item } = purchase
            const title = localizedCatalogText(language, item.title, item.titleEn)
            const isExpanded = expandedSlug === item.slug
            const detail = isExpanded ? detailQuery.data : undefined

            return (
              <Card key={item.slug} className="overflow-hidden p-0">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ase-bg2">
                    <AuthenticatedImage src={item.imageUrl} alt="" fit="cover" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ase-text">{title}</h3>
                      <Badge>{t(`catalog.groupLabels.${item.type}`)}</Badge>
                      <Badge variant="info">{t(`catalog.myPurchases.source.${purchase.source}`) || purchase.source}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ase-muted">
                      {t('catalog.myPurchases.purchasedAt')}: {formatDate(purchase.purchased_at, language)}
                      {purchase.organization_name ? ` · ${t('catalog.myPurchases.organizationVia')}: ${purchase.organization_name}` : ''}
                    </p>
                    {item.includedItems && item.includedItems.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                          {t('catalog.myPurchases.includedItems')}
                        </p>
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {item.includedItems.map((entry) => (
                            <li
                              key={entry}
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ase-text2"
                            >
                              {entry}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link to={`/catalog/${item.type}/${item.slug}`}>
                      <Button size="sm" variant="primary">
                        {t('catalog.myPurchases.access')}
                      </Button>
                    </Link>
                    {item.hasResourceContent ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Download className="h-4 w-4" strokeWidth={1.75} />}
                        disabled={pendingDownloadSlug === item.slug && downloadMutation.isPending}
                        onClick={() => downloadMutation.mutate(item.slug)}
                      >
                        {t('catalog.myPurchases.download')}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      rightIcon={
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          strokeWidth={1.75}
                        />
                      }
                      onClick={() => setExpandedSlug(isExpanded ? null : item.slug)}
                    >
                      {isExpanded ? t('catalog.myPurchases.hide') : t('catalog.myPurchases.moreInfo')}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4">
                    {detailQuery.isLoading ? (
                      <Skeleton className="h-24 w-full rounded-xl" />
                    ) : detailQuery.isError ? (
                      <p className="text-sm text-ase-error">{t('catalog.myPurchases.detailError')}</p>
                    ) : detail ? (
                      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.purchasedAt')}
                          </p>
                          <p className="mt-0.5 text-sm text-ase-text">{formatDate(purchase.purchased_at, language)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.amountPaid')}
                          </p>
                          <p className="mt-0.5 text-sm text-ase-text">
                            {detail.amount_paid != null && detail.currency
                              ? formatMoney(detail.amount_paid, detail.currency)
                              : t('catalog.free')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.discount')}
                          </p>
                          <p className="mt-0.5 text-sm text-ase-text">
                            {detail.discount_amount && detail.currency
                              ? formatMoney(detail.discount_amount, detail.currency)
                              : t('catalog.myPurchases.none')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.method')}
                          </p>
                          <p className="mt-0.5 text-sm text-ase-text">
                            {t(`catalog.myPurchases.source.${purchase.source}`) || purchase.source}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.paymentStatus')}
                          </p>
                          <Badge variant={paymentStatusTone(detail.payment_status)} className="mt-1">
                            {(t(`catalog.myPurchases.paymentStatusLabels.${detail.payment_status}`) as string) ||
                              detail.payment_status ||
                              t('catalog.myPurchases.notAvailable')}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.version')}
                          </p>
                          <p className="mt-0.5 text-sm text-ase-text">
                            {detail.acquired_version === 'standard'
                              ? t('catalog.myPurchases.standardVersion')
                              : detail.acquired_version}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('catalog.myPurchases.invoice')}
                          </p>
                          {detail.receipt_url ? (
                            <a
                              href={detail.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-ase-brand hover:underline"
                            >
                              <ReceiptText className="h-3.5 w-3.5" />
                              {t('catalog.myPurchases.viewInvoice')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="mt-0.5 text-sm text-ase-text2">{t('catalog.myPurchases.notAvailable')}</p>
                          )}
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<LifeBuoy className="h-4 w-4" strokeWidth={1.75} />}
                            onClick={() => setSupportTarget(purchase)}
                          >
                            {t('catalog.myPurchases.requestSupport')}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}

      <SupportRequestModal
        purchase={supportTarget}
        onClose={() => {
          setSupportTarget(null)
          supportMutation.reset()
        }}
        mutation={supportMutation}
      />
    </div>
  )
}

function SupportRequestModal({
  purchase,
  onClose,
  mutation,
}: {
  purchase: MyPurchase | null
  onClose: () => void
  mutation: ReturnType<typeof useMutation<unknown, unknown, string>>
}) {
  const { t, language } = useI18n()
  const [message, setMessage] = useState('')

  if (!purchase) return null
  const title = localizedCatalogText(language, purchase.item.title, purchase.item.titleEn)

  return (
    <Modal open={Boolean(purchase)} title={`${t('catalog.myPurchases.supportModalTitle')} — ${title}`} onClose={onClose}>
      <div className="space-y-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder={t('catalog.myPurchases.supportPlaceholder') as string}
        />
        {mutation.isError ? <p className="text-sm text-ase-error">{t('catalog.myPurchases.supportError')}</p> : null}
        {mutation.isSuccess ? <p className="text-sm text-emerald-300">{t('catalog.myPurchases.supportSent')}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('catalog.myPurchases.cancel')}
          </Button>
          <Button
            disabled={!message.trim() || mutation.isPending}
            onClick={() => {
              const composed = `[${title}] ${message.trim()}`
              mutation.mutate(composed, { onSuccess: () => setMessage('') })
            }}
          >
            {mutation.isPending ? t('catalog.myPurchases.sending') : t('catalog.myPurchases.send')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
