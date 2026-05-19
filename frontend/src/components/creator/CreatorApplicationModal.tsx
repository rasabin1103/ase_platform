import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createMyAccessRequest } from '../../api/access_requests.api'
import { useI18n } from '../../i18n'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

type Scope = 'courses' | 'products' | 'both'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text'

export function CreatorApplicationModal({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n()
  const [scope, setScope] = useState<Scope>('both')
  const [experience, setExperience] = useState('')
  const [knowledgeAreas, setKnowledgeAreas] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [motivation, setMotivation] = useState('')
  const [initialProposal, setInitialProposal] = useState('')
  const [qualityAgreement, setQualityAgreement] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const message = [
        `Scope: ${scope}`,
        `Experience: ${experience}`,
        `Knowledge areas: ${knowledgeAreas}`,
        portfolioUrl ? `Portfolio: ${portfolioUrl}` : null,
        `Motivation: ${motivation}`,
        `Initial proposal: ${initialProposal}`,
        qualityAgreement ? 'Quality agreement: accepted' : null,
      ]
        .filter(Boolean)
        .join('\n\n')
      return createMyAccessRequest({
        request_type: 'creator_access',
        target_type: 'platform_creator_permission',
        title: t('requestsPage.creatorModalTitle'),
        message,
      })
    },
    onSuccess: () => {
      onSuccess?.()
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={t('creatorApplication.title')}>
      <p className="mb-4 text-sm text-ase-muted">{t('creatorApplication.subtitle')}</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.type')}
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className={fieldClass}
          >
            <option value="courses">{t('creatorApplication.fields.typeCourses')}</option>
            <option value="products">{t('creatorApplication.fields.typeProducts')}</option>
            <option value="both">{t('creatorApplication.fields.typeBoth')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.experience')}
          </label>
          <textarea required minLength={10} value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} className={fieldClass} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.knowledgeAreas')}
          </label>
          <textarea required minLength={2} value={knowledgeAreas} onChange={(e) => setKnowledgeAreas(e.target.value)} rows={2} className={fieldClass} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.portfolioUrl')}
          </label>
          <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.motivation')}
          </label>
          <textarea required minLength={10} value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={3} className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.initialProposal')}
          </label>
          <textarea required minLength={10} value={initialProposal} onChange={(e) => setInitialProposal(e.target.value)} rows={3} className={fieldClass} />
        </div>
        <label className="flex items-start gap-2 text-sm text-ase-text2">
          <input type="checkbox" checked={qualityAgreement} onChange={(e) => setQualityAgreement(e.target.checked)} className="mt-1" />
          {t('creatorApplication.fields.qualityAgreement')}
        </label>
        {mutation.isError ? <p className="text-sm text-red-300">{t('creatorApplication.messages.submitError')}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('creatorApplication.actions.cancel')}</Button>
          <Button type="submit" disabled={!qualityAgreement || mutation.isPending}>{t('creatorApplication.actions.submit')}</Button>
        </div>
      </form>
    </Modal>
  )
}
