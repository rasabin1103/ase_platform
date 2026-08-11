import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { broadcastAnnouncement } from '../../api/adminDashboard.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'

export function AdminAnnouncementsPage() {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [lastSent, setLastSent] = useState<{ title: string; recipients: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      broadcastAnnouncement({
        title: title.trim(),
        body: body.trim() || null,
        link: link.trim() || null,
      }),
    onSuccess: (data) => {
      setLastSent({ title: title.trim(), recipients: data.recipients })
      setTitle('')
      setBody('')
      setLink('')
    },
  })

  const canSend = title.trim().length > 0 && !mutation.isPending

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="amber"
        badge={t('adminAnnouncements.heroBadge')}
        title={t('adminAnnouncements.title')}
        subtitle={t('adminAnnouncements.subtitle')}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSend) mutation.mutate()
            }}
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('adminAnnouncements.fields.title')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('adminAnnouncements.placeholders.title')}
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('adminAnnouncements.fields.body')}</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('adminAnnouncements.placeholders.body')}
                maxLength={2000}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('adminAnnouncements.fields.link')}</label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t('adminAnnouncements.placeholders.link')}
                maxLength={500}
              />
            </div>

            {mutation.isError && (
              <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {t('adminAnnouncements.error')}
              </div>
            )}

            <Button type="submit" disabled={!canSend} leftIcon={<Megaphone className="h-4 w-4" strokeWidth={1.75} />}>
              {mutation.isPending ? t('adminAnnouncements.sending') : t('adminAnnouncements.send')}
            </Button>
          </form>
        </Card>

        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminAnnouncements.aboutTitle')}</div>
          <p className="mt-3 text-sm text-ase-text2">{t('adminAnnouncements.aboutBody')}</p>
          {lastSent && (
            <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="text-sm font-semibold text-ase-text">{lastSent.title}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-ase-text2">
                <Badge variant="success">
                  {String(t('adminAnnouncements.recipientsSent')).replace('{{count}}', String(lastSent.recipients))}
                </Badge>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
