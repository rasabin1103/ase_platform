import { useQuery } from '@tanstack/react-query'
import { FileText, Receipt } from 'lucide-react'
import { listInvoices, type Invoice } from '../../api/billing.api'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'
import { useI18n } from '../../i18n'

function statusTone(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'paid') return 'success'
  if (status === 'open') return 'warning'
  if (status === 'uncollectible' || status === 'void') return 'error'
  return 'default'
}

function formatAmount(invoice: Invoice): string {
  try {
    return invoice.amount_paid.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })
  } catch {
    return `${invoice.amount_paid.toFixed(2)} ${invoice.currency}`
  }
}

/** Branded in-app invoice history — the receipts themselves still open on
 * Stripe's hosted page/PDF (there's no value in re-rendering what Stripe
 * already generates correctly), but browsing them happens inside ASE's own
 * UI instead of always bouncing to the external portal, so returning
 * clients get brand continuity for the thing they check most often: "did
 * my last payment go through, and where's the receipt." Same glow/depth
 * premium finish as the admin application map, since this card sits on the
 * private dashboard's most-visited settings page. */
export function InvoiceHistoryCard() {
  const { t, language } = useI18n()
  const query = useQuery({ queryKey: ['billing-invoices'], queryFn: listInvoices, staleTime: 60_000 })
  const invoices = query.data ?? []

  return (
    <Card className="w-full overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur transition duration-300 ease-out hover:border-ase-brand/25 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ase-text">{t('profilePage.billing.invoices.title')}</h2>
          <p className="text-sm text-ase-text2">{t('profilePage.billing.invoices.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState title={t('profilePage.billing.invoices.loadError')} description="" />
        ) : invoices.length === 0 ? (
          <EmptyState title={t('profilePage.billing.invoices.empty')} description="" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  <th className="pb-3 pr-4">{t('profilePage.billing.invoices.colDate')}</th>
                  <th className="pb-3 pr-4">{t('profilePage.billing.invoices.colPlan')}</th>
                  <th className="pb-3 pr-4">{t('profilePage.billing.invoices.colAmount')}</th>
                  <th className="pb-3 pr-4">{t('profilePage.billing.invoices.colStatus')}</th>
                  <th className="pb-3">{t('profilePage.billing.invoices.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className="animate-fade-in-up border-b border-white/[0.05] text-ase-text2 transition hover:bg-white/[0.03]"
                    style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                  >
                    <td className="py-3 pr-4 tabular-nums">
                      {new Date(invoice.created_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES')}
                    </td>
                    <td className="py-3 pr-4">{invoice.plan_name ?? invoice.number ?? '—'}</td>
                    <td className="py-3 pr-4 font-semibold text-ase-text tabular-nums">{formatAmount(invoice)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusTone(invoice.status)}>
                        {(t(`profilePage.billing.invoices.status.${invoice.status}`) as string) || invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {invoice.invoice_pdf || invoice.hosted_invoice_url ? (
                        <a
                          href={invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-ase-text2 transition hover:border-ase-brand/40 hover:text-ase-text"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {invoice.invoice_pdf
                            ? (t('profilePage.billing.invoices.viewPdf') as string)
                            : (t('profilePage.billing.invoices.viewOnline') as string)}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
