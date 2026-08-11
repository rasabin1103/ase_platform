import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { listAdminBookRedemptions } from '../../api/adminDashboard.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { downloadCsv } from '../../utils/csv'

const LIMIT = 50

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminBookRedemptionsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)

  const filters = useMemo(
    () => ({
      limit: LIMIT,
      offset,
      search: search.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, dateFrom, dateTo, offset],
  )

  const query = useQuery({ queryKey: ['admin-book-redemptions', filters], queryFn: () => listAdminBookRedemptions(filters) })
  const items = query.data?.items ?? []
  const hasFilters = Boolean(search || dateFrom || dateTo)

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setOffset(0)
  }

  const handleExport = () => {
    downloadCsv(
      'book-redemptions',
      items.map((row) => ({
        id: row.id,
        user_email: row.user_email ?? '',
        book_title: row.book_title,
        github_username: row.github_username ?? '',
        created_at: row.created_at,
      })),
    )
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('adminBookRedemptions.heroBadge')}
        title={t('adminBookRedemptions.title')}
        subtitle={t('adminBookRedemptions.subtitle')}
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Input
              placeholder={t('adminBookRedemptions.filters.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            />
          </div>
          <Input
            type="date"
            aria-label={t('adminBookRedemptions.filters.dateFrom')}
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setOffset(0) }}
          />
          <Input
            type="date"
            aria-label={t('adminBookRedemptions.filters.dateTo')}
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setOffset(0) }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            {t('adminBookRedemptions.filters.clear')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('private.common.exportCsv')}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminBookRedemptions.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('adminBookRedemptions.empty')} description={t('adminBookRedemptions.emptyHint')} />
      ) : (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-0 shadow-soft">
          <Table className="table-fixed">
            <THead>
              <TR>
                <TH className="w-[20%]">{t('adminBookRedemptions.columns.date')}</TH>
                <TH className="w-[30%]">{t('adminBookRedemptions.columns.user')}</TH>
                <TH className="w-[30%]">{t('adminBookRedemptions.columns.book')}</TH>
                <TH className="w-[20%]">{t('adminBookRedemptions.columns.githubUsername')}</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((row) => (
                <TR key={row.id}>
                  <TD className="text-ase-muted">{fmtDate(row.created_at)}</TD>
                  <TD className="text-ase-text">
                    {row.user_email ?? <Badge variant="default">{t('adminBookRedemptions.anonymous')}</Badge>}
                  </TD>
                  <TD className="text-ase-text2">{row.book_title}</TD>
                  <TD className="text-ase-text2">{row.github_username ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination limit={LIMIT} offset={offset} total={query.data?.total ?? 0} onOffsetChange={setOffset} />
        </Card>
      )}
    </div>
  )
}
