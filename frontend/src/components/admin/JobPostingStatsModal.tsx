import type { ReactNode } from 'react'
import { Eye, MousePointerClick, Percent } from 'lucide-react'
import type { JobPostingAdmin } from '../../api/jobPostingsAdmin.api'
import { useI18n } from '../../i18n'
import { Modal } from '../ui/Modal'

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-ase-muted">{icon}</div>
      <div>
        <div className="text-lg font-semibold text-ase-text">{value}</div>
        <div className="text-xs text-ase-muted">{label}</div>
      </div>
    </div>
  )
}

export function JobPostingStatsModal({ posting, onClose }: { posting: JobPostingAdmin | null; onClose: () => void }) {
  const { t } = useI18n()

  const clickRate = posting && posting.viewsTotal > 0 ? ((posting.clicksTotal / posting.viewsTotal) * 100).toFixed(1) : '0.0'

  return (
    <Modal open={Boolean(posting)} onClose={onClose} title={posting ? `${t('adminJobPostings.stats.title')} — ${posting.title}` : ''}>
      {posting ? (
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<Eye className="h-5 w-5" strokeWidth={1.75} />} label={t('adminJobPostings.stats.views') as string} value={String(posting.viewsTotal)} />
          <StatTile
            icon={<MousePointerClick className="h-5 w-5" strokeWidth={1.75} />}
            label={t('adminJobPostings.stats.clicks') as string}
            value={String(posting.clicksTotal)}
          />
          <StatTile icon={<Percent className="h-5 w-5" strokeWidth={1.75} />} label={t('adminJobPostings.stats.clickRate') as string} value={`${clickRate}%`} />
        </div>
      ) : null}
    </Modal>
  )
}
