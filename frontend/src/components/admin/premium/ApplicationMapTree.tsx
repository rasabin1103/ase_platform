import { Building2, User as UserIcon } from 'lucide-react'
import type { ApplicationMap, ApplicationMapMember } from '../../../api/adminDashboard.api'
import { Badge } from '../../ui/Badge'
import { EmptyState } from '../../ui/EmptyState'
import { Skeleton } from '../../ui/Skeleton'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || parts[0].slice(0, 2).toUpperCase()
}

const ORG_TYPE_ACCENT: Record<string, { ring: string; badge: string; glow: string }> = {
  business: {
    ring: 'border-cyan-300/30 hover:border-cyan-300/50',
    badge: 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-200/25',
    glow: 'hover:shadow-[0_0_28px_rgba(34,211,238,0.16)]',
  },
  enterprise: {
    ring: 'border-violet-300/30 hover:border-violet-300/50',
    badge: 'bg-violet-400/15 text-violet-100 ring-1 ring-violet-200/25',
    glow: 'hover:shadow-[0_0_28px_rgba(167,139,250,0.16)]',
  },
  academy: {
    ring: 'border-amber-300/30 hover:border-amber-300/50',
    badge: 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-200/25',
    glow: 'hover:shadow-[0_0_28px_rgba(251,191,36,0.16)]',
  },
}
const DEFAULT_ACCENT = ORG_TYPE_ACCENT.business

function MemberRow({ member }: { member: ApplicationMapMember }) {
  const label = member.display_name || member.email
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.04]">
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[9px] font-bold text-ase-text2 ring-1 ring-white/10">
          {initials(label)}
        </div>
        <span className="truncate text-xs text-ase-text2">{label}</span>
      </div>
      <span className="flex flex-wrap gap-1">
        {member.role_codes.map((code) => (
          <Badge key={code} variant="info" className="!py-0.5 !text-[9px]">
            {code}
          </Badge>
        ))}
      </span>
    </div>
  )
}

/** Renders the dashboard's "application map" as a premium tree/graph — a
 * single glowing "ASE Core" root with two connected branches (Organizations,
 * Individual users), Organizations further branching into one accent-colored
 * card per organization. Connector lines use the classic pure-CSS org-chart
 * technique (nested <ul>/<li> with ::before/::after border stubs) rather
 * than a charting library, since the shape here is a simple, small,
 * fixed-depth hierarchy that doesn't need one. */
export function ApplicationMapTree({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: ApplicationMap | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="mt-6">
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-6">
        <EmptyState
          title={t('private.common.couldNotLoad')}
          description={t('adminDashboard.applicationMap.loadError')}
          actionLabel={t('adminDashboard.retry')}
          onAction={onRetry}
        />
      </div>
    )
  }

  const organizations = data?.organizations ?? []
  const individualUsers = data?.individual_users ?? []

  return (
    <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-6 shadow-[0_26px_90px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="amt-tree relative overflow-x-auto pb-4">
        <style>{`
          @keyframes amtFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes amtGlowPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
          .amt-tree ul { display: flex; justify-content: center; padding-top: 32px; position: relative; }
          .amt-tree li { display: flex; flex-direction: column; align-items: center; list-style: none; position: relative; padding: 32px 16px 0 16px; }
          .amt-tree li::before, .amt-tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 1px solid rgba(34,211,238,0.28); width: 50%; height: 32px; }
          .amt-tree li::after { right: auto; left: 50%; border-left: 1px solid rgba(34,211,238,0.28); }
          .amt-tree li:only-child { padding-top: 0; }
          .amt-tree li:only-child::before, .amt-tree li:only-child::after { display: none; }
          .amt-tree li:first-child::before, .amt-tree li:last-child::after { border: 0 none; }
          .amt-tree li:last-child::before { border-right: 1px solid rgba(34,211,238,0.28); border-radius: 0 10px 0 0; }
          .amt-tree li:first-child::after { border-radius: 10px 0 0 0; }
          .amt-tree > ul { padding-top: 0; }
          .amt-tree > ul > li { padding-top: 0; }
          .amt-tree > ul > li::before, .amt-tree > ul > li::after { display: none; }
          .amt-node { animation: amtFadeIn 0.45s ease-out both; }
          .amt-glow-ring { animation: amtGlowPulse 2.8s ease-in-out infinite; }
        `}</style>

        <ul>
          <li>
            <div className="amt-node relative inline-flex flex-col items-center gap-2">
              <div className="amt-glow-ring pointer-events-none absolute inset-0 -z-10 rounded-full bg-cyan-400/25 blur-2xl" />
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/40 bg-ase-bg2/90 text-sm font-extrabold tracking-wide text-cyan-100 shadow-[0_0_44px_rgba(34,211,238,0.35)]">
                ASE
              </div>
              <div className="rounded-full border border-cyan-200/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                {t('adminDashboard.applicationMap.rootLabel')}
              </div>
            </div>

            <ul>
              <li>
                <div className="amt-node inline-flex flex-col items-center gap-2 rounded-2xl border border-cyan-300/25 bg-ase-surface px-5 py-3.5 shadow-soft transition hover:border-cyan-300/40">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/15 ring-1 ring-cyan-200/25">
                    <Building2 className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div className="text-sm font-semibold text-ase-text">{t('adminDashboard.applicationMap.organizations')}</div>
                  <Badge variant="default">
                    {data?.organizations_total ?? 0} {t('adminDashboard.applicationMap.organizationsTotal')}
                  </Badge>
                </div>

                <ul>
                  {organizations.length === 0 ? (
                    <li>
                      <div className="amt-node w-52 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center text-xs text-ase-muted">
                        {t('adminDashboard.applicationMap.noOrganizations')}
                      </div>
                    </li>
                  ) : (
                    organizations.map((org, idx) => {
                      const accent = ORG_TYPE_ACCENT[org.type] ?? DEFAULT_ACCENT
                      return (
                        <li key={org.uuid}>
                          <div
                            className={cn(
                              'amt-node w-60 rounded-2xl border bg-ase-bg2/60 p-3.5 text-left shadow-soft transition duration-200 hover:-translate-y-1',
                              accent.ring,
                              accent.glow,
                            )}
                            style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div
                                className={cn(
                                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold',
                                  accent.badge,
                                )}
                              >
                                {initials(org.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-ase-text">{org.name}</div>
                                <div className="text-[10px] uppercase tracking-wide text-ase-muted">
                                  {t(`organizationsPage.types.${org.type}`)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-ase-muted">
                              <span>{t('adminDashboard.applicationMap.membersLabel')}</span>
                              <span className="font-semibold text-ase-text2">{org.members.length}</span>
                            </div>
                            <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto border-t border-white/10 pt-1.5 pr-1">
                              {org.members.length === 0 ? (
                                <div className="text-xs text-ase-muted">{t('adminDashboard.applicationMap.noMembers')}</div>
                              ) : (
                                org.members.map((m) => <MemberRow key={m.uuid} member={m} />)
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </li>

              <li>
                <div className="amt-node w-72 rounded-2xl border border-violet-300/25 bg-ase-surface p-4 text-left shadow-soft transition hover:border-violet-300/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/15 ring-1 ring-violet-200/25">
                        <UserIcon className="h-4 w-4 text-violet-200" />
                      </div>
                      <div className="text-sm font-semibold text-ase-text">{t('adminDashboard.applicationMap.individualUsers')}</div>
                    </div>
                    <Badge variant="default">
                      {data?.individual_users_total ?? 0} {t('adminDashboard.applicationMap.individualUsersTotal')}
                    </Badge>
                  </div>
                  {data?.individual_users_truncated ? (
                    <div className="mt-1.5 text-[11px] text-ase-muted">{t('adminDashboard.applicationMap.truncatedHint')}</div>
                  ) : null}
                  <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
                    {individualUsers.length === 0 ? (
                      <div className="py-4 text-center text-sm text-ase-muted">
                        {t('adminDashboard.applicationMap.noIndividualUsers')}
                      </div>
                    ) : (
                      individualUsers.map((u) => {
                        const label = u.display_name || u.email
                        return (
                          <div
                            key={u.uuid}
                            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ase-bg2/40 px-2.5 py-1.5 transition hover:border-violet-300/25 hover:bg-white/[0.04]"
                          >
                            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-400/15 text-[9px] font-bold text-violet-100 ring-1 ring-violet-200/20">
                              {initials(label)}
                            </div>
                            <span className="truncate text-xs text-ase-text2">{label}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  )
}
