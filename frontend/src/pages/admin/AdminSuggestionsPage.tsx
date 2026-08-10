import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listAllSuggestions, updateSuggestion, type Suggestion, type SuggestionStatus } from '../../api/suggestions.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { PremiumHero, PremiumMetricCard } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'

function statusVariant(status: string): 'warning' | 'success' | 'default' {
  if (status === 'pending') return 'warning'
  if (status === 'resolved') return 'success'
  return 'default'
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminSuggestionsPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editing, setEditing] = useState<Suggestion | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState<SuggestionStatus>('pending')

  const query = useQuery({
    queryKey: ['admin-suggestions', statusFilter],
    queryFn: () => listAllSuggestions({ limit: 200, status: (statusFilter || undefined) as SuggestionStatus | undefined }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, admin_note }: { id: number; status: SuggestionStatus; admin_note: string }) =>
      updateSuggestion(id, { status, admin_note }),
    onSuccess: async () => {
      setEditing(null)
      await qc.invalidateQueries({ queryKey: ['admin-suggestions'] })
    },
  })

  const items = query.data?.items ?? []
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const resolvedCount = items.filter((i) => i.status === 'resolved').length

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('adminSuggestions.badge')}
        title={t('adminSuggestions.title')}
        subtitle={t('adminSuggestions.subtitle')}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PremiumMetricCard label={t('adminSuggestions.stats.total') as string} value={query.data?.total ?? items.length} icon="✉" accent="from-ase-brand to-ase-brand" />
        <PremiumMetricCard label={t('adminSuggestions.stats.pending') as string} value={pendingCount} icon="○" accent="from-ase-brand to-ase-brand" />
        <PremiumMetricCard label={t('adminSuggestions.stats.resolved') as string} value={resolvedCount} icon="✓" accent="from-ase-brand to-ase-brand" />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-ase-muted">{t('adminSuggestions.filterLabel')}</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
            <option value="">{t('adminSuggestions.filterAll')}</option>
            <option value="pending">{t('suggestions.status.pending')}</option>
            <option value="reviewed">{t('suggestions.status.reviewed')}</option>
            <option value="resolved">{t('suggestions.status.resolved')}</option>
          </Select>
        </div>

        <div className="mt-4">
          {query.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : query.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('adminSuggestions.loadError')} />
          ) : items.length === 0 ? (
            <EmptyState title={t('adminSuggestions.emptyTitle')} description={t('adminSuggestions.emptyDescription')} />
          ) : (
            <div className="divide-y divide-white/10">
              {items.map((s) => (
                <div key={s.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ase-muted">
                      <span>{s.user_email ?? `#${s.user_id}`}</span>
                      {s.organization_name ? <span>· {s.organization_name}</span> : null}
                      <span>· {formatDate(s.created_at)}</span>
                      <Badge variant="default">
                        {s.target === 'organization' ? t('suggestions.targetOrganization') : t('suggestions.targetPlatform')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ase-text2">{s.message}</p>
                    {s.admin_note ? (
                      <p className="mt-2 text-sm text-amber-100/90">
                        <span className="font-medium">{t('suggestions.adminNote')}: </span>
                        {s.admin_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusVariant(s.status)}>{t(`suggestions.status.${s.status}`)}</Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(s)
                        setStatusDraft(s.status)
                        setNoteDraft(s.admin_note ?? '')
                      }}
                    >
                      {t('adminSuggestions.review')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={t('adminSuggestions.modalTitle') as string}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editing) return
                updateMutation.mutate({ id: editing.id, status: statusDraft, admin_note: noteDraft })
              }}
            >
              {updateMutation.isPending ? t('adminSuggestions.saving') : t('adminSuggestions.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ase-text2">{editing?.message}</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('adminSuggestions.statusLabel')}</label>
            <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as SuggestionStatus)}>
              <option value="pending">{t('suggestions.status.pending')}</option>
              <option value="reviewed">{t('suggestions.status.reviewed')}</option>
              <option value="resolved">{t('suggestions.status.resolved')}</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('suggestions.adminNote')}</label>
            <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
