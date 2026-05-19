import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listAdminAccessRequests,
  listMyAccessRequests,
  reviewAdminAccessRequest,
  type AdminAccessRequest,
  type MeAccessRequest,
} from '../api/access_requests.api'
import { AccessRequestModal } from '../components/access-requests/AccessRequestModal'
import { AuthenticatedImage } from '../components/ui/AuthenticatedImage'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { PremiumHero } from '../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../i18n'
import { useRbac } from '../rbac/useRbac'
import { useAuth } from '../hooks/useAuth'
import { avatarDisplayPath } from '../utils/mediaUrls'

function statusVariant(status: string): 'warning' | 'success' | 'default' {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  return 'default'
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

export function RequestsPage() {
  const { t } = useI18n()
  const { isSuperuser, primaryRole, can } = useRbac()
  const { currentUser, loadCurrentUser } = useAuth()
  const qc = useQueryClient()
  const isAdminReviewer = isSuperuser || primaryRole === 'super_admin'

  const [creatorModalOpen, setCreatorModalOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminAccessRequest | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const queryKey = isAdminReviewer ? ['admin-access-requests'] : ['my-access-requests']
  const query = useQuery({
    queryKey,
    queryFn: () =>
      isAdminReviewer ? listAdminAccessRequests({ limit: 100 }) : listMyAccessRequests({ limit: 50 }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, admin_notes }: { id: number; status: 'approved' | 'rejected'; admin_notes?: string }) =>
      reviewAdminAccessRequest(id, { status, admin_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-access-requests'] })
      setRejectTarget(null)
      setRejectNotes('')
    },
  })

  const items = query.data?.items ?? []
  const pendingCount = items.filter((i) => i.status === 'pending').length

  const creatorStatus = currentUser?.creator_status ?? 'none'
  const canCreate = Boolean(currentUser?.can_create_content)
  const showCreatorCta =
    !isAdminReviewer && !canCreate && creatorStatus !== 'pending' && creatorStatus !== 'approved'

  const requestTypeLabel = (type: string) => {
    const key = `requestsPage.requestTypes.${type}` as const
    const label = t(key)
    return label === key ? type : label
  }

  const targetTypeLabel = (type: string) => {
    const key = `requestsPage.targetTypes.${type}` as const
    const label = t(key)
    return label === key ? type : label
  }

  const statusLabel = (status: string) => {
    const key = `requestsPage.statuses.${status}` as const
    const label = t(key)
    return label === key ? status : label
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent={isAdminReviewer ? 'amber' : 'cyan'}
        badge={isAdminReviewer ? t('adminDashboard.heroBadge') : t('independentDashboard.heroBadge')}
        title={isAdminReviewer ? t('requestsPage.adminTitle') : t('requestsPage.title')}
        subtitle={isAdminReviewer ? t('requestsPage.adminSubtitle') : t('requestsPage.subtitle')}
        contextChips={
          isAdminReviewer ? (
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
              {t('requestsPage.pendingReview')}: {pendingCount}
            </span>
          ) : null
        }
      />

      {!isAdminReviewer && canCreate ? (
        <Card className="border-cyan-300/20 bg-cyan-300/5 p-6">
          <h2 className="text-lg font-semibold text-ase-text">{t('requestsPage.createContentSection')}</h2>
          <p className="mt-2 text-sm text-ase-text2">{t('requestsPage.createContentHint')}</p>
        </Card>
      ) : null}

      {!isAdminReviewer && showCreatorCta ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ase-text">{t('requestsPage.creatorCtaTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ase-text2">{t('requestsPage.creatorCtaDescription')}</p>
          <Button className="mt-4" onClick={() => setCreatorModalOpen(true)}>
            {t('requestsPage.creatorCtaButton')}
          </Button>
        </Card>
      ) : null}

      {!isAdminReviewer && creatorStatus === 'pending' ? (
        <p className="text-sm text-amber-200/90">{t('requestsPage.creatorCtaPending')}</p>
      ) : null}
      {!isAdminReviewer && creatorStatus === 'rejected' ? (
        <p className="text-sm text-ase-muted">{t('requestsPage.creatorCtaRejected')}</p>
      ) : null}

      {query.isLoading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full" />
        </Card>
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('requestsPage.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('requestsPage.emptyTitle')}
          description={
            isAdminReviewer ? t('requestsPage.adminEmptyDescription') : t('requestsPage.emptyDescription')
          }
        />
      ) : isAdminReviewer ? (
        <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 backdrop-blur">
          {(items as AdminAccessRequest[]).map((item) => (
            <AdminRequestRow
              key={item.uuid}
              item={item}
              canReview={can('approveRequest') || isSuperuser}
              onApprove={() => reviewMutation.mutate({ id: item.id, status: 'approved' })}
              onReject={() => {
                setRejectTarget(item)
                setRejectNotes('')
              }}
              pending={reviewMutation.isPending}
              requestTypeLabel={requestTypeLabel(item.request_type)}
              targetTypeLabel={targetTypeLabel(item.target_type)}
              statusLabel={statusLabel(item.status)}
              t={t}
            />
          ))}
        </Card>
      ) : (
        <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 backdrop-blur">
          {(items as MeAccessRequest[]).map((item) => (
            <UserRequestRow
              key={item.uuid}
              item={item}
              requestTypeLabel={requestTypeLabel(item.request_type)}
              targetTypeLabel={targetTypeLabel(item.target_type)}
              statusLabel={statusLabel(item.status)}
              t={t}
            />
          ))}
        </Card>
      )}

      <AccessRequestModal
        open={creatorModalOpen}
        onClose={() => setCreatorModalOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['my-access-requests'] })
          void loadCurrentUser()
        }}
        requestType="creator_access"
        targetType="platform_creator_permission"
        title={t('requestsPage.creatorModalTitle')}
        modalTitle={t('requestsPage.creatorModalTitle')}
        modalDescription={t('requestsPage.creatorCtaDescription')}
      />

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title={t('requestsPage.rejectModalTitle')}
        closeLabel={t('requestsPage.modalClose')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t('requestsPage.modalClose')}
            </Button>
            <Button
              variant="danger"
              disabled={reviewMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return
                reviewMutation.mutate({
                  id: rejectTarget.id,
                  status: 'rejected',
                  admin_notes: rejectNotes.trim() || undefined,
                })
              }}
            >
              {t('requestsPage.confirmReject')}
            </Button>
          </div>
        }
      >
        <label className="mb-2 block text-xs font-medium text-ase-muted">{t('requestsPage.rejectNotesLabel')}</label>
        <Textarea
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={3}
          placeholder={t('requestsPage.rejectNotesPlaceholder')}
          className="rounded-xl border-white/10 bg-ase-bg2/50"
        />
      </Modal>
    </div>
  )
}

function UserRequestRow({
  item,
  requestTypeLabel,
  targetTypeLabel,
  statusLabel,
  t,
}: {
  item: MeAccessRequest
  requestTypeLabel: string
  targetTypeLabel: string
  statusLabel: string
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 p-5">
      <div>
        <p className="font-semibold text-ase-text">{item.title}</p>
        <p className="mt-1 text-xs text-ase-muted">
          {requestTypeLabel} · {targetTypeLabel}
          {item.target_id && item.target_id !== 'platform' ? ` · ${item.target_id}` : ''}
        </p>
        <p className="mt-1 text-xs text-ase-muted">
          {t('requestsPage.submittedAt')}: {formatDate(item.created_at)}
        </p>
        {item.message ? (
          <p className="mt-2 text-sm text-ase-text2">
            <span className="font-medium text-ase-muted">{t('requestsPage.yourMessage')}: </span>
            {item.message}
          </p>
        ) : null}
        {item.admin_notes ? (
          <p className="mt-2 text-sm text-amber-100/90">
            <span className="font-medium">{t('requestsPage.adminNotes')}: </span>
            {item.admin_notes}
          </p>
        ) : null}
      </div>
      <Badge variant={statusVariant(item.status)}>{statusLabel}</Badge>
    </div>
  )
}

function AdminRequestRow({
  item,
  canReview,
  onApprove,
  onReject,
  pending,
  requestTypeLabel,
  targetTypeLabel,
  statusLabel,
  t,
}: {
  item: AdminAccessRequest
  canReview: boolean
  onApprove: () => void
  onReject: () => void
  pending: boolean
  requestTypeLabel: string
  targetTypeLabel: string
  statusLabel: string
  t: (key: string) => string
}) {
  const r = item.requester
  const name = r.display_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email
  const avatarSrc = avatarDisplayPath(r.has_avatar, r.avatar_url)

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-ase-bg2">
          {avatarSrc ? (
            <AuthenticatedImage src={avatarSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-ase-muted">
              {(name[0] ?? '?').toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ase-text">{name}</p>
          <p className="text-xs text-ase-muted">{r.email}</p>
          <p className="mt-2 font-medium text-ase-text">{item.title}</p>
          <p className="mt-1 text-xs text-ase-muted">
            {requestTypeLabel} · {targetTypeLabel}
            {item.target_id && item.target_id !== 'platform' ? (
              <>
                {' '}
                · {t('requestsPage.relatedItem')}: {item.target_id}
              </>
            ) : null}
          </p>
          {item.message ? <p className="mt-2 text-sm text-ase-text2">{item.message}</p> : null}
          <p className="mt-1 text-xs text-ase-muted">{formatDate(item.created_at)}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge variant={statusVariant(item.status)}>{statusLabel}</Badge>
        {item.status === 'pending' && canReview ? (
          <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={onApprove}>
              {t('requestsPage.approve')}
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={onReject}>
              {t('requestsPage.reject')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}


