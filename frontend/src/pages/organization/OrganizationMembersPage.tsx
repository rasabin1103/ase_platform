import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  approveJoinRequest,
  cancelMemberInvite,
  createMemberInvite,
  listOrganizationJoinRequests,
  listOrganizationMemberInvites,
  rejectJoinRequest,
  searchUnaffiliatedUsers,
} from '../../api/orgMembership.api'
import { Card } from '../../components/ui/Card'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useI18n } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'approved' || status === 'accepted') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected' || status === 'declined') return 'error'
  return 'default'
}

function statusLabel(t: (key: string) => unknown, status: string): string {
  const key = `orgMembership.admin.status${status.charAt(0).toUpperCase()}${status.slice(1)}`
  return (t(key) as string) || status
}

export function OrganizationMembersPage() {
  const { t } = useI18n()
  const { primaryRole, hasPermission } = useRbac()
  const queryClient = useQueryClient()
  const canInvite = hasPermission('users.create')
  const isOwner = primaryRole === 'org_owner'

  // ---- join requests ----

  const joinRequestsQuery = useQuery({
    queryKey: ['org-membership', 'join-requests', 'org'],
    queryFn: () => listOrganizationJoinRequests(),
  })
  const [joinRequestError, setJoinRequestError] = useState<string | null>(null)

  const approveMut = useMutation({
    mutationFn: approveJoinRequest,
    onSuccess: async () => {
      setJoinRequestError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'join-requests', 'org'] })
    },
    onError: () => setJoinRequestError(t('orgMembership.admin.approveError') as string),
  })
  const rejectMut = useMutation({
    mutationFn: rejectJoinRequest,
    onSuccess: async () => {
      setJoinRequestError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'join-requests', 'org'] })
    },
    onError: () => setJoinRequestError(t('orgMembership.admin.rejectError') as string),
  })

  const pendingJoinRequests = (joinRequestsQuery.data?.items ?? []).filter((r) => r.status === 'pending')

  // ---- invite users ----

  const [userSearch, setUserSearch] = useState('')
  const userSearchQuery = useQuery({
    queryKey: ['org-membership', 'users', 'search', userSearch],
    queryFn: () => searchUnaffiliatedUsers(userSearch),
    enabled: canInvite && userSearch.trim().length >= 2,
  })
  const [inviteError, setInviteError] = useState<string | null>(null)

  const invitesQuery = useQuery({
    queryKey: ['org-membership', 'member-invites', 'org'],
    queryFn: () => listOrganizationMemberInvites(),
    enabled: canInvite,
  })
  const invitedUserUuids = new Set(
    (invitesQuery.data?.items ?? []).filter((i) => i.status === 'pending').map((i) => i.invited_user_uuid),
  )

  const inviteMut = useMutation({
    mutationFn: createMemberInvite,
    onSuccess: async () => {
      setInviteError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'member-invites', 'org'] })
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'users', 'search'] })
    },
    onError: () => setInviteError(t('orgMembership.admin.inviteError') as string),
  })
  const cancelInviteMut = useMutation({
    mutationFn: cancelMemberInvite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'member-invites', 'org'] })
    },
  })

  const sentInvites = invitesQuery.data?.items ?? []

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative z-[1] max-w-3xl">
          <Eyebrow>{t('orgMembership.admin.heroBadge')}</Eyebrow>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('orgMembership.admin.heroTitle')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ase-text2">{t('orgMembership.admin.heroSubtitle')}</p>
        </div>
      </section>

      <Card className="p-6" interactive>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ase-text">{t('orgMembership.admin.joinRequestsTitle')}</div>
            <div className="mt-1 text-sm text-ase-text2">{t('orgMembership.admin.joinRequestsSubtitle')}</div>
          </div>
          {!isOwner ? (
            <Badge variant="info">{t('orgMembership.admin.ownerOnlyHint')}</Badge>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {joinRequestsQuery.isLoading ? (
            <p className="text-sm text-ase-muted">…</p>
          ) : pendingJoinRequests.length === 0 ? (
            <p className="text-sm text-ase-muted">{t('orgMembership.admin.joinRequestsEmpty')}</p>
          ) : (
            pendingJoinRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-ase-bg2/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ase-text">
                    {req.user_display_name || req.user_email}
                  </div>
                  <div className="truncate text-xs text-ase-muted">{req.user_email}</div>
                </div>
                {isOwner ? (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approveMut.isPending} onClick={() => approveMut.mutate(req.id)}>
                      {t('orgMembership.admin.approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={rejectMut.isPending}
                      onClick={() => rejectMut.mutate(req.id)}
                    >
                      {t('orgMembership.admin.reject')}
                    </Button>
                  </div>
                ) : (
                  <Badge variant={statusVariant(req.status)}>{statusLabel(t, req.status)}</Badge>
                )}
              </div>
            ))
          )}
          {joinRequestError ? <p className="text-sm text-ase-error">{joinRequestError}</p> : null}
        </div>
      </Card>

      {canInvite ? (
        <Card className="p-6" interactive>
          <div className="text-sm font-semibold text-ase-text">{t('orgMembership.admin.inviteTitle')}</div>
          <div className="mt-1 text-sm text-ase-text2">{t('orgMembership.admin.inviteSubtitle')}</div>

          <div className="mt-4">
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('orgMembership.admin.inviteSearchPlaceholder') as string}
            />
          </div>

          <div className="mt-4 space-y-3">
            {userSearch.trim().length < 2 ? (
              <p className="text-xs text-ase-muted">{t('orgMembership.admin.inviteSearchHint')}</p>
            ) : userSearchQuery.isLoading ? (
              <p className="text-sm text-ase-muted">…</p>
            ) : (userSearchQuery.data?.items?.length ?? 0) === 0 ? (
              <p className="text-sm text-ase-muted">{t('orgMembership.admin.inviteSearchEmpty')}</p>
            ) : (
              userSearchQuery.data?.items.map((u) => {
                const alreadyInvited = invitedUserUuids.has(u.uuid)
                return (
                  <div
                    key={u.uuid}
                    className="flex flex-col gap-2 rounded-lg border border-white/10 bg-ase-bg2/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ase-text">{u.display_name || u.email}</div>
                      <div className="truncate text-xs text-ase-muted">{u.email}</div>
                    </div>
                    <Button
                      size="sm"
                      disabled={alreadyInvited || inviteMut.isPending}
                      onClick={() => inviteMut.mutate(u.uuid)}
                    >
                      {alreadyInvited
                        ? (t('orgMembership.admin.alreadyInvited') as string)
                        : (t('orgMembership.admin.inviteButton') as string)}
                    </Button>
                  </div>
                )
              })
            )}
            {inviteError ? <p className="text-sm text-ase-error">{inviteError}</p> : null}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
              {t('orgMembership.admin.sentInvitesTitle')}
            </div>
            <div className="mt-3 space-y-2">
              {sentInvites.length === 0 ? (
                <p className="text-sm text-ase-muted">{t('orgMembership.admin.sentInvitesEmpty')}</p>
              ) : (
                sentInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ase-bg2/30 p-3"
                  >
                    <div className="min-w-0 text-sm text-ase-text2">
                      <span className="font-medium text-ase-text">
                        {invite.invited_user_display_name || invite.invited_user_email}
                      </span>{' '}
                      <Badge variant={statusVariant(invite.status)} className="ml-1 text-[10px]">
                        {statusLabel(t, invite.status)}
                      </Badge>
                    </div>
                    {invite.status === 'pending' ? (
                      <Button size="sm" variant="ghost" onClick={() => cancelInviteMut.mutate(invite.id)}>
                        {t('orgMembership.admin.cancelInvite')}
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
