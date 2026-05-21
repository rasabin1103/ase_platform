import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  listAdminAccessRequests,
  listMyAccessRequests,
  reviewAdminAccessRequest,
  type AdminAccessRequest,
  type MeAccessRequest,
} from '../api/access_requests.api'
import { AccessRequestModal } from '../components/access-requests/AccessRequestModal'
import {
  AccessRequestTimelineCard,
  CapabilitiesCompactStrip,
  EmptyCapabilityState,
  FeatureStatusBadge,
  RequestCapabilityCard,
  resolveCapabilityCta,
} from '../components/capabilities'
import { CAPABILITY_ICONS } from '../components/capabilities/capabilityIcons'
import { useUserCapabilities } from '../components/capabilities/useUserCapabilities'
import { AuthenticatedImage } from '../components/ui/AuthenticatedImage'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { PremiumHero } from '../components/admin/premium/PremiumAdminUi'
import { useI18n, tStringArray } from '../i18n'
import { useRbac } from '../rbac/useRbac'
import { useAuth } from '../hooks/useAuth'
import { avatarDisplayPath } from '../utils/mediaUrls'

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
  const { loadCurrentUser } = useAuth()
  const qc = useQueryClient()
  const isAdminReviewer = isSuperuser || primaryRole === 'super_admin'
  const { canCreate, creatorStatus, showCreatorRequestCta, getStatus } = useUserCapabilities()

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

  const creatorStatusCapability = getStatus('content_creator')
  const creatorCta = resolveCapabilityCta(creatorStatusCapability, {
    request: t('capabilities.items.content_creator.ctaRequest') as string,
    active: t('capabilities.items.content_creator.ctaActive') as string,
    pending: t('capabilities.items.content_creator.ctaPending') as string,
    restricted: t('capabilities.items.content_creator.ctaRestricted') as string,
  })

  return (
    <div className="space-y-10 pb-16">
      <PremiumHero
        accent={isAdminReviewer ? 'amber' : 'cyan'}
        badge={isAdminReviewer ? t('adminDashboard.heroBadge') : t('capabilities.portal.badge')}
        title={isAdminReviewer ? t('requestsPage.adminTitle') : t('requestsPage.title')}
        subtitle={isAdminReviewer ? t('requestsPage.adminSubtitle') : t('requestsPage.subtitle')}
        contextChips={
          isAdminReviewer ? (
            <FeatureStatusBadge
              status="pending"
              label={`${t('requestsPage.pendingReview')}: ${pendingCount}`}
            />
          ) : null
        }
      />

      {!isAdminReviewer ? (
        <>
          {canCreate ? (
            <RequestCapabilityCard
              icon={CAPABILITY_ICONS.content_creator}
              accent="violet"
              title={t('requestsPage.createContentSection') as string}
              description={t('requestsPage.createContentHint') as string}
              benefits={tStringArray(t, 'capabilities.items.content_creator.benefits')}
              status="active"
              statusLabel={t('capabilities.status.active') as string}
              tooltip={t('capabilities.items.content_creator.tooltip') as string}
              ctaLabel={t('capabilities.items.publish_products.ctaActive') as string}
              ctaHref="/products"
              ctaVariant="secondary"
            />
          ) : null}

          {showCreatorRequestCta ? (
            <RequestCapabilityCard
              icon={CAPABILITY_ICONS.content_creator}
              accent="violet"
              title={t('requestsPage.creatorCtaTitle') as string}
              description={t('requestsPage.creatorCtaDescription') as string}
              benefits={tStringArray(t, 'capabilities.items.content_creator.benefits')}
              status={creatorStatusCapability}
              statusLabel={t(`capabilities.status.${creatorStatusCapability}`) as string}
              tooltip={t('capabilities.items.content_creator.tooltip') as string}
              ctaLabel={creatorCta.label}
              ctaDisabled={creatorCta.disabled}
              ctaVariant={creatorCta.variant}
              onCta={() => setCreatorModalOpen(true)}
            />
          ) : null}

          {creatorStatus === 'pending' && !canCreate ? (
            <Card className="flex items-center gap-4 rounded-[1.5rem] border-amber-300/20 bg-amber-300/5 p-5">
              <Sparkles className="h-8 w-8 shrink-0 text-amber-200/90" aria-hidden />
              <p className="text-sm leading-relaxed text-amber-100/90">{t('requestsPage.creatorCtaPending')}</p>
            </Card>
          ) : null}
          {creatorStatus === 'rejected' && !canCreate ? (
            <Card className="p-5 text-sm text-ase-text2">{t('requestsPage.creatorCtaRejected')}</Card>
          ) : null}

          <CapabilitiesCompactStrip onRequestCreator={() => setCreatorModalOpen(true)} />
        </>
      ) : null}

      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">
          {isAdminReviewer ? t('requestsPage.adminTitle') : t('capabilities.portal.requestsSection')}
        </h2>

        {query.isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </Card>
        ) : query.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('requestsPage.loadError')} />
        ) : items.length === 0 ? (
          isAdminReviewer ? (
            <EmptyState
              title={t('requestsPage.emptyTitle')}
              description={t('requestsPage.adminEmptyDescription')}
            />
          ) : (
            <EmptyCapabilityState
              title={t('requestsPage.emptyTitle') as string}
              description={t('requestsPage.emptyDescription') as string}
            />
          )
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {isAdminReviewer
              ? (items as AdminAccessRequest[]).map((item) => (
                  <AdminRequestCard
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
                ))
              : (items as MeAccessRequest[]).map((item) => (
                  <AccessRequestTimelineCard
                    key={item.uuid}
                    title={item.title}
                    typeLabel={requestTypeLabel(item.request_type)}
                    targetLabel={targetTypeLabel(item.target_type)}
                    status={item.status}
                    statusLabel={statusLabel(item.status)}
                    submittedAt={formatDate(item.created_at)}
                    message={item.message}
                    adminNotes={item.admin_notes}
                    yourMessageLabel={t('requestsPage.yourMessage') as string}
                    teamNoteLabel={t('requestsPage.adminNotes') as string}
                    submittedLabel={t('capabilities.requestCard.submitted') as string}
                    timelinePending={t('capabilities.requestCard.timelinePending') as string}
                    timelineApproved={t('capabilities.requestCard.timelineApproved') as string}
                    timelineRejected={t('capabilities.requestCard.timelineRejected') as string}
                  />
                ))}
          </div>
        )}
      </section>

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
        icon={CAPABILITY_ICONS.content_creator}
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

function AdminRequestCard({
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

  const footer =
    item.status === 'pending' && canReview ? (
      <>
        <Button size="sm" disabled={pending} onClick={onApprove}>
          {t('requestsPage.approve')}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={onReject}>
          {t('requestsPage.reject')}
        </Button>
      </>
    ) : null

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-white/[0.08] bg-ase-surface/55 p-5 backdrop-blur sm:p-6">
      <div className="mb-4 flex gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ase-bg2">
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
        </div>
      </div>
      <AccessRequestTimelineCard
        title={item.title}
        typeLabel={requestTypeLabel}
        targetLabel={targetTypeLabel}
        status={item.status}
        statusLabel={statusLabel}
        submittedAt={formatDate(item.created_at)}
        message={item.message}
        yourMessageLabel={t('requestsPage.yourMessage')}
        teamNoteLabel={t('requestsPage.adminNotes')}
        submittedLabel={t('capabilities.requestCard.submitted')}
        timelinePending={t('capabilities.requestCard.timelinePending')}
        timelineApproved={t('capabilities.requestCard.timelineApproved')}
        timelineRejected={t('capabilities.requestCard.timelineRejected')}
        footer={footer}
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </Card>
  )
}
