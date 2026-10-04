import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { deleteAdminJobPosting, listAdminJobPostings, type JobPostingAdmin } from '../../api/jobPostingsAdmin.api'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { PremiumHero, PremiumMetricCard } from '../../components/admin/premium/PremiumAdminUi'
import { JobPostingStatsModal } from '../../components/admin/JobPostingStatsModal'
import { useI18n } from '../../i18n'

export function AdminJobPostingsPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<JobPostingAdmin | null>(null)
  const [viewingStats, setViewingStats] = useState<JobPostingAdmin | null>(null)

  const query = useQuery({
    queryKey: ['admin-job-postings', search],
    queryFn: () => listAdminJobPostings({ limit: 200, search: search.trim() || undefined }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAdminJobPosting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-job-postings'] })
      setDeleting(null)
    },
  })

  const items = query.data?.items ?? []
  const publishedCount = items.filter((i) => i.status === 'published').length
  const totalViews = items.reduce((sum, i) => sum + i.viewsTotal, 0)
  const totalClicks = items.reduce((sum, i) => sum + i.clicksTotal, 0)

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('adminJobPostings.premium.badge')}
        title={t('adminJobPostings.title')}
        subtitle={t('adminJobPostings.subtitle')}
        actions={
          <ButtonLink to="/admin/job-postings/new" size="sm" leftIcon={<span>+</span>}>
            {t('adminJobPostings.create')}
          </ButtonLink>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              <PremiumMetricCard label={t('adminJobPostings.colStatus')} value={query.data?.total ?? items.length} icon="◇" accent="from-violet-300 to-fuchsia-500" />
              <PremiumMetricCard label={t('adminJobPostings.status.published')} value={publishedCount} icon="✓" accent="from-emerald-300 to-teal-500" />
              <PremiumMetricCard label={t('adminJobPostings.stats.views')} value={totalViews} icon="◎" accent="from-cyan-300 to-blue-500" />
              <PremiumMetricCard label={t('adminJobPostings.stats.clicks')} value={totalClicks} icon="→" accent="from-amber-300 to-orange-500" />
            </div>
          </Card>
        }
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 backdrop-blur">
        <Input
          className="h-11 min-w-[200px] rounded-xl border-white/10 bg-ase-bg2/50"
          placeholder={t('adminJobPostings.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminJobPostings.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('adminJobPostings.empty')} description={t('adminJobPostings.subtitle')} />
      ) : (
        <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0">
          <div className="grid grid-cols-[1fr_140px_110px_120px_220px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
            <span>{t('adminJobPostings.colTitle')}</span>
            <span>{t('adminJobPostings.colCategory')}</span>
            <span>{t('adminJobPostings.colStatus')}</span>
            <span>{t('adminJobPostings.colUpdated')}</span>
            <span>{t('adminJobPostings.colActions')}</span>
          </div>
          {items.map((posting) => (
            <div key={posting.id} className="grid grid-cols-[1fr_140px_110px_120px_220px] items-center gap-2 px-4 py-3 text-sm">
              <div className="font-medium text-ase-text">{posting.title}</div>
              <div className="text-xs text-ase-muted">{posting.category}</div>
              <Badge variant={posting.status === 'published' ? 'success' : 'default'}>{t(`adminJobPostings.status.${posting.status}`)}</Badge>
              <span className="text-xs text-ase-muted">{new Date(posting.updated_at).toLocaleDateString()}</span>
              <span className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  onClick={() => setViewingStats(posting)}
                >
                  {t('adminJobPostings.stats.button')}
                </Button>
                <ButtonLink to={`/admin/job-postings/${posting.id}/edit`} size="sm" variant="secondary">
                  {t('adminJobPostings.edit')}
                </ButtonLink>
                <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setDeleting(posting)}>
                  {t('adminJobPostings.delete')}
                </Button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={t('adminJobPostings.delete')}>
        <p className="text-sm text-ase-text2">{t('adminJobPostings.confirmDelete')}</p>
        <p className="mt-2 font-medium text-ase-text">{deleting?.title}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            {t('adminJobPostings.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteMut.isPending} onClick={() => deleting && deleteMut.mutate(deleting.id)}>
            {t('adminJobPostings.delete')}
          </Button>
        </div>
      </Modal>

      <JobPostingStatsModal posting={viewingStats} onClose={() => setViewingStats(null)} />
    </div>
  )
}
