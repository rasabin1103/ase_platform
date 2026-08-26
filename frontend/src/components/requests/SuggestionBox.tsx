import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createSuggestion, listMySuggestions, type SuggestionTarget } from '../../api/suggestions.api'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { useI18n } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'

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

export function SuggestionBox() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const { roleCodes } = useRbac()
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<SuggestionTarget>('platform')

  // Only regular org members get to pick a recipient (their org's admins or
  // the platform). Org owners/admins *are* the org's admin contact, so their
  // suggestions always go straight to the platform super admin.
  const canChooseTarget = useMemo(() => roleCodes.includes('member'), [roleCodes])

  const mySuggestionsQuery = useQuery({
    queryKey: ['my-suggestions'],
    queryFn: () => listMySuggestions({ limit: 20 }),
  })

  const createMutation = useMutation({
    mutationFn: ({ msg, tgt }: { msg: string; tgt: SuggestionTarget }) => createSuggestion(msg, tgt),
    onSuccess: async () => {
      setMessage('')
      await qc.invalidateQueries({ queryKey: ['my-suggestions'] })
    },
  })

  const items = mySuggestionsQuery.data?.items ?? []

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-ase-text">{t('suggestions.boxTitle')}</h2>
      <p className="mt-1 text-sm text-ase-text2">{t('suggestions.boxSubtitle')}</p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = message.trim()
          if (!trimmed) return
          createMutation.mutate({ msg: trimmed, tgt: canChooseTarget ? target : 'platform' })
        }}
      >
        {canChooseTarget ? (
          <div>
            <label htmlFor="suggestion-target" className="mb-1 block text-xs font-medium text-ase-text2">{t('suggestions.targetLabel')}</label>
            <Select id="suggestion-target" value={target} onChange={(e) => setTarget(e.target.value as SuggestionTarget)}>
              <option value="platform">{t('suggestions.targetPlatform')}</option>
              <option value="organization">{t('suggestions.targetOrganization')}</option>
            </Select>
          </div>
        ) : null}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t('suggestions.placeholder') as string}
          className="rounded-xl border-white/10 bg-ase-bg2/50"
        />
        {createMutation.isError ? (
          <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
            {t('suggestions.error')}
          </div>
        ) : null}
        {createMutation.isSuccess ? (
          <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            {t('suggestions.sent')}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={!message.trim() || createMutation.isPending}>
            {createMutation.isPending ? t('suggestions.sending') : t('suggestions.send')}
          </Button>
        </div>
      </form>

      {items.length > 0 ? (
        <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('suggestions.myTitle')}</h3>
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ase-text2">{s.message}</p>
                <Badge variant={statusVariant(s.status)}>{t(`suggestions.status.${s.status}`)}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-ase-muted">{formatDate(s.created_at)}</p>
              {s.admin_note ? (
                <p className="mt-2 text-sm text-amber-100/90">
                  <span className="font-medium">{t('suggestions.adminNote')}: </span>
                  {s.admin_note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
