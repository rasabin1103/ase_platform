import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { me } from '../api/auth.api'
import { createOrganization } from '../api/onboarding.api'
import { listOrganizations } from '../api/organizations.api'
import {
  acceptMemberInvite,
  cancelJoinRequest,
  createJoinRequest,
  declineMemberInvite,
  listMyJoinRequests,
  listMyMemberInvites,
  searchOrganizations,
} from '../api/orgMembership.api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { setActiveOrganizationUuid } from '../auth/auth.store'
import { useI18n } from '../i18n'

const schema = z.object({
  organization_name: z.string().min(2),
  organization_slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa kebab-case'),
  organization_type: z.enum(['individual', 'business', 'enterprise', 'academy']),
})

type Values = z.infer<typeof schema>

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const meQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: me })
  const orgsQuery = useQuery({ queryKey: ['organizations', 'onboarding'], queryFn: listOrganizations })
  // A personal "individual" workspace doesn't count as a real organization —
  // independent users keep access to this page (from the private nav) to
  // browse and request to join a real organization even after creating one.
  const hasRealOrganization = (orgsQuery.data?.items ?? []).some((o) => o.type !== 'individual')

  // If a real org appears (e.g. user got invited, or a join-request/invite was accepted), go select/auto.
  useEffect(() => {
    if (hasRealOrganization) {
      navigate('/select-organization', { replace: true })
    }
  }, [hasRealOrganization, navigate])

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_name: '',
      organization_slug: '',
      organization_type: 'business',
    },
  })

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (created) => {
      // created has organization_uuid
      setActiveOrganizationUuid(created.organization_uuid)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
      navigate('/dashboard', { replace: true })
    },
  })

  const display = meQuery.data?.display_name ?? meQuery.data?.email ?? 'your account'

  // ---- incoming member invites ----

  const invitesQuery = useQuery({ queryKey: ['org-membership', 'member-invites', 'mine'], queryFn: listMyMemberInvites })
  const pendingInvites = useMemo(
    () => (invitesQuery.data?.items ?? []).filter((i) => i.status === 'pending'),
    [invitesQuery.data],
  )
  const [inviteActionError, setInviteActionError] = useState<string | null>(null)

  const acceptInviteMut = useMutation({
    mutationFn: acceptMemberInvite,
    onSuccess: async () => {
      setInviteActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'member-invites', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: () => setInviteActionError(t('orgMembership.onboarding.acceptError') as string),
  })
  const declineInviteMut = useMutation({
    mutationFn: declineMemberInvite,
    onSuccess: async () => {
      setInviteActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'member-invites', 'mine'] })
    },
    onError: () => setInviteActionError(t('orgMembership.onboarding.declineError') as string),
  })

  // ---- browse organizations & request to join ----

  const [orgSearch, setOrgSearch] = useState('')
  const orgSearchQuery = useQuery({
    queryKey: ['org-membership', 'organizations', 'search', orgSearch],
    queryFn: () => searchOrganizations(orgSearch),
    enabled: orgSearch.trim().length >= 2,
  })
  const [joinRequestError, setJoinRequestError] = useState<string | null>(null)

  const myJoinRequestsQuery = useQuery({
    queryKey: ['org-membership', 'join-requests', 'mine'],
    queryFn: listMyJoinRequests,
  })
  const pendingJoinRequests = useMemo(
    () => (myJoinRequestsQuery.data?.items ?? []).filter((r) => r.status === 'pending'),
    [myJoinRequestsQuery.data],
  )

  const requestJoinMut = useMutation({
    mutationFn: (organizationUuid: string) => createJoinRequest(organizationUuid),
    onSuccess: async () => {
      setJoinRequestError(null)
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'organizations', 'search'] })
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'join-requests', 'mine'] })
    },
    onError: () => setJoinRequestError(t('orgMembership.onboarding.requestError') as string),
  })
  const cancelJoinRequestMut = useMutation({
    mutationFn: cancelJoinRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'join-requests', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['org-membership', 'organizations', 'search'] })
    },
  })

  const statusLabel = (status: string) => {
    const key = `orgMembership.onboarding.status${status.charAt(0).toUpperCase()}${status.slice(1)}`
    return (t(key) as string) || status
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="info" className="w-fit">
          Onboarding
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text">Welcome, {display}</h1>
        <p className="mt-1 text-sm text-ase-text2">
          You don’t have an organization yet. Create one to start, create an individual workspace, join an existing
          organization, or accept an invite.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2" interactive>
          <div className="text-sm font-semibold text-ase-text">Create organization</div>
          <div className="mt-1 text-sm text-ase-text2">Primary path for teams and businesses.</div>

          <form
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_name</label>
              <Input
                placeholder="Acme Corporation"
                {...form.register('organization_name', {
                  onChange: (e) => {
                    const name = String(e.target.value ?? '')
                    const cur = form.getValues('organization_slug')
                    if (!cur) form.setValue('organization_slug', slugify(name))
                  },
                })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_slug</label>
              <Input placeholder="acme-corp" {...form.register('organization_slug')} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">organization_type</label>
              <Select {...form.register('organization_type')}>
                <option value="individual">individual</option>
                <option value="business">business</option>
                <option value="enterprise">enterprise</option>
                <option value="academy">academy</option>
              </Select>
            </div>

            {mutation.isError && (
              <div className="sm:col-span-2 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                Could not create organization. Check slug duplicates/permissions.
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create organization'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-6" interactive>
            <div className="text-sm font-semibold text-ase-text">Individual workspace</div>
            <div className="mt-1 text-sm text-ase-text2">Quick setup for solo work.</div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  const base = meQuery.data?.display_name || 'individual'
                  const name = `Workspace — ${base}`
                  mutation.mutate({
                    organization_name: name,
                    organization_slug: slugify(name),
                    organization_type: 'individual',
                  })
                }}
              >
                Create individual workspace
              </Button>
            </div>
          </Card>

          <Card className="p-6" interactive>
            <div className="text-sm font-semibold text-ase-text">{t('orgMembership.onboarding.invitesTitle')}</div>
            <div className="mt-1 text-sm text-ase-text2">{t('orgMembership.onboarding.invitesSubtitle')}</div>
            <div className="mt-4 space-y-3">
              {pendingInvites.length === 0 ? (
                <p className="text-sm text-ase-muted">{t('orgMembership.onboarding.invitesEmpty')}</p>
              ) : (
                pendingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-white/10 bg-ase-bg2/40 p-3">
                    <div className="text-sm font-medium text-ase-text">
                      {String(t('orgMembership.onboarding.invitedToOrg')).replace('{{org}}', invite.organization_name)}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        disabled={acceptInviteMut.isPending}
                        onClick={() => acceptInviteMut.mutate(invite.id)}
                      >
                        {t('orgMembership.onboarding.acceptButton')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={declineInviteMut.isPending}
                        onClick={() => declineInviteMut.mutate(invite.id)}
                      >
                        {t('orgMembership.onboarding.declineButton')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {inviteActionError ? <p className="text-sm text-ase-error">{inviteActionError}</p> : null}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6" interactive>
        <Badge variant="info" className="w-fit">
          {t('orgMembership.onboarding.joinBadge')}
        </Badge>
        <div className="mt-3 text-sm font-semibold text-ase-text">{t('orgMembership.onboarding.joinTitle')}</div>
        <div className="mt-1 text-sm text-ase-text2">{t('orgMembership.onboarding.joinSubtitle')}</div>

        <div className="mt-4">
          <Input
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder={t('orgMembership.onboarding.searchPlaceholder') as string}
          />
        </div>

        <div className="mt-4 space-y-3">
          {orgSearch.trim().length < 2 ? (
            <p className="text-xs text-ase-muted">{t('orgMembership.onboarding.searchHint')}</p>
          ) : orgSearchQuery.isLoading ? (
            <p className="text-sm text-ase-muted">…</p>
          ) : (orgSearchQuery.data?.items?.length ?? 0) === 0 ? (
            <p className="text-sm text-ase-muted">{t('orgMembership.onboarding.searchEmpty')}</p>
          ) : (
            orgSearchQuery.data?.items.map((org) => (
              <div
                key={org.uuid}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-ase-bg2/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ase-text">{org.name}</div>
                  <div className="text-xs text-ase-muted">
                    {String(t('orgMembership.onboarding.membersCount')).replace('{{count}}', String(org.member_count))}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={org.has_pending_request || requestJoinMut.isPending}
                  onClick={() => requestJoinMut.mutate(org.uuid)}
                >
                  {org.has_pending_request
                    ? (t('orgMembership.onboarding.alreadyRequested') as string)
                    : (t('orgMembership.onboarding.requestButton') as string)}
                </Button>
              </div>
            ))
          )}
          {joinRequestError ? <p className="text-sm text-ase-error">{joinRequestError}</p> : null}
        </div>

        {pendingJoinRequests.length > 0 ? (
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
              {t('orgMembership.onboarding.myRequestsTitle')}
            </div>
            <div className="mt-3 space-y-2">
              {pendingJoinRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ase-bg2/30 p-3"
                >
                  <div className="min-w-0 text-sm text-ase-text2">
                    <span className="font-medium text-ase-text">{req.organization_name}</span>{' '}
                    <Badge variant="warning" className="ml-1 text-[10px]">
                      {statusLabel(req.status)}
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => cancelJoinRequestMut.mutate(req.id)}>
                    {t('orgMembership.onboarding.cancelRequest')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
