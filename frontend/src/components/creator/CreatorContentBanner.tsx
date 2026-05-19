import { useState } from 'react'
import { useI18n } from '../../i18n'
import { Can } from '../../rbac/Can'
import { useRbac } from '../../rbac/useRbac'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CreatorApplicationModal } from './CreatorApplicationModal'

export function CreatorContentBanner() {
  const { t } = useI18n()
  const { primaryRole, hasPermission, isConsumerMode } = useRbac()
  const [open, setOpen] = useState(false)

  if (!isConsumerMode && primaryRole !== 'independent_user' && !hasPermission('creator.request')) {
    return null
  }

  return (
    <>
      <Card className="mb-6 border-cyan-300/20 bg-cyan-300/5 p-4">
        <p className="text-sm text-ase-text">{t('creatorApplication.requiresApproval')}</p>
        <p className="mt-1 text-xs text-ase-muted">{t('creatorApplication.messages.requiresApproval')}</p>
        <Can permission="creator.request">
          <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
            {t('creatorApplication.requestAuthorization')}
          </Button>
        </Can>
      </Card>
      <CreatorApplicationModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
