import { useQuery } from '@tanstack/react-query'
import { getUserStats } from '../../api/users.api'
import type { User } from '../../types/user.types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Table, TBody, TD, THead, TH, TR } from '../ui/Table'
import { useI18n } from '../../i18n'

function fmtDate(iso: string | null) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

// Standalone modal (not tied to any particular list row) — takes the
// target `user` directly rather than just a uuid, so the caller (UsersPage)
// doesn't need a second lookup just to show a name in the title while the
// stats query is still loading.
export function UserStatsModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { t } = useI18n()

  const query = useQuery({
    queryKey: ['admin-user-stats', user?.uuid],
    queryFn: () => getUserStats(user!.uuid),
    enabled: user !== null,
  })

  const stats = query.data
  const title = user
    ? `${t('usersPage.statsModal.title')} · ${user.display_name || user.email}`
    : (t('usersPage.statsModal.title') as string)

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={title}
      footer={<Button onClick={onClose}>{t('usersPage.statsModal.close')}</Button>}
    >
      <div className="space-y-6">
        <p className="text-sm text-ase-text2">{t('usersPage.statsModal.subtitle')}</p>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : query.isError ? (
          <EmptyState title={t('usersPage.statsModal.loadError') as string} />
        ) : stats ? (
          <>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('usersPage.statsModal.accountSection')}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('usersPage.statsModal.createdAt') as string} value={fmtDate(stats.user.created_at) ?? '—'} />
                <MiniStat
                  label={t('usersPage.statsModal.lastLogin') as string}
                  value={fmtDate(stats.user.last_login_at) ?? (t('usersPage.statsModal.never') as string)}
                />
                <MiniStat
                  label={t('usersPage.statsModal.loyaltyTier') as string}
                  value={stats.loyalty_tier ?? (t('usersPage.statsModal.noTier') as string)}
                />
                <MiniStat label={t('usersPage.statsModal.country') as string} value={stats.country ?? '—'} />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('usersPage.statsModal.planSection')}</h3>
              {stats.plan.plan_code ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{stats.plan.plan_name}</Badge>
                  {stats.plan.subscription_status ? (
                    <Badge variant={stats.plan.subscription_status === 'active' ? 'success' : 'warning'}>
                      {stats.plan.subscription_status}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-ase-muted">{t('usersPage.statsModal.noPlan')}</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('usersPage.statsModal.organizationsSection')}</h3>
              {stats.organizations.length === 0 ? (
                <p className="text-sm text-ase-muted">{t('usersPage.statsModal.noOrganizations')}</p>
              ) : (
                <div className="space-y-2">
                  {stats.organizations.map((org) => (
                    <div
                      key={org.organization_uuid}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-ase-text">{org.organization_name}</div>
                        <div className="text-xs text-ase-muted">
                          {org.organization_type} · {org.role_codes.join(', ')}
                        </div>
                      </div>
                      <Badge variant={org.membership_status === 'active' ? 'success' : 'default'}>
                        {org.membership_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('usersPage.statsModal.purchasesSection')}</h3>
              <div className="mb-3">
                <MiniStat label={t('usersPage.statsModal.totalPurchases') as string} value={String(stats.purchases_total)} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {t('usersPage.statsModal.recentPurchases')}
              </div>
              {stats.purchases_recent.length === 0 ? (
                <p className="mt-2 text-sm text-ase-muted">{t('usersPage.statsModal.noPurchases')}</p>
              ) : (
                <Table className="mt-2 table-fixed">
                  <THead>
                    <TR>
                      <TH className="w-[45%]">Item</TH>
                      <TH className="w-[20%]">Type</TH>
                      <TH className="w-[20%]">Source</TH>
                      <TH className="w-[15%]">Date</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {stats.purchases_recent.map((p, idx) => (
                      <TR key={idx}>
                        <TD className="truncate text-ase-text2">{p.catalog_item_title}</TD>
                        <TD className="text-ase-muted">{p.catalog_item_type}</TD>
                        <TD className="text-ase-muted">{p.source}</TD>
                        <TD className="text-ase-muted">{fmtDate(p.purchased_at)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('usersPage.statsModal.testRunsSection')}</h3>
              <div className="mb-3">
                <MiniStat label={t('usersPage.statsModal.totalRuns') as string} value={String(stats.test_runs_total)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.test_runs_by_status)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <Badge key={key} variant="info">
                      {key}: {count}
                    </Badge>
                  ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(stats.test_runs_by_conclusion)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <Badge key={key} variant={key === 'success' ? 'success' : key === 'failure' ? 'error' : 'default'}>
                      {key}: {count}
                    </Badge>
                  ))}
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {t('usersPage.statsModal.recentRuns')}
              </div>
              {stats.test_runs_recent.length === 0 ? (
                <p className="mt-2 text-sm text-ase-muted">{t('usersPage.statsModal.noRuns')}</p>
              ) : (
                <Table className="mt-2 table-fixed">
                  <THead>
                    <TR>
                      <TH className="w-[45%]">Item</TH>
                      <TH className="w-[20%]">Status</TH>
                      <TH className="w-[20%]">Conclusion</TH>
                      <TH className="w-[15%]">Date</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {stats.test_runs_recent.map((run) => (
                      <TR key={run.uuid}>
                        <TD className="truncate text-ase-text2">{run.catalog_item_title}</TD>
                        <TD className="text-ase-muted">{run.status}</TD>
                        <TD className="text-ase-muted">{run.conclusion ?? '—'}</TD>
                        <TD className="text-ase-muted">{fmtDate(run.created_at)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </section>
          </>
        ) : null}
      </div>
    </Modal>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}
