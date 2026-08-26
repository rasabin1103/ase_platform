import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  listDataResetDomains,
  resetAllData,
  resetDataDomain,
  type DataDomain,
} from '../../api/adminDataReset.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useI18n } from '../../i18n'

type PendingTarget = { kind: 'domain'; domain: DataDomain } | { kind: 'all' }

export function AdminDataResetPanel() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-data-reset-domains'], queryFn: listDataResetDomains })

  const [pending, setPending] = useState<PendingTarget | null>(null)
  const [phraseInput, setPhraseInput] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const domains = query.data?.domains ?? []
  const masterPhrase = query.data?.master_confirm_phrase ?? ''
  const superAdminEmail = query.data?.super_admin_email ?? ''

  const expectedPhrase = pending == null ? '' : pending.kind === 'all' ? masterPhrase : pending.domain.confirm_phrase

  function closeModal() {
    setPending(null)
    setPhraseInput('')
    setPassword('')
    setModalError(null)
  }

  async function handleConfirm() {
    if (!pending) return
    setSubmitting(true)
    setModalError(null)
    try {
      const result =
        pending.kind === 'all'
          ? await resetAllData(phraseInput, password)
          : await resetDataDomain(pending.domain.key, phraseInput, password)
      setBanner({ kind: 'success', text: `${t('adminDataReset.successPrefix')} ${result.message}` })
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['admin-data-reset-domains'] })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : String(err))
      setModalError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  const canConfirm = phraseInput.trim() === expectedPhrase && password.length > 0 && !submitting

  return (
    <div className="space-y-8">
      {banner && (
        <div
          className={
            banner.kind === 'success'
              ? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300'
              : 'rounded-2xl border border-ase-error/30 bg-ase-error/10 px-5 py-4 text-sm text-ase-error'
          }
        >
          {banner.text}
        </div>
      )}

      <Card className="rounded-[2rem] border-ase-error/30 bg-ase-error/[0.04] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-ase-error" strokeWidth={1.75} />
            <div>
              <div className="text-base font-semibold text-ase-text">{t('adminDataReset.masterTitle')}</div>
              <p className="mt-1 max-w-xl text-sm text-ase-text2">{t('adminDataReset.masterSubtitle')}</p>
              {superAdminEmail && (
                <p className="mt-2 text-xs text-ase-muted">
                  {t('adminDataReset.preservedNotePrefix')} <span className="font-medium text-ase-text2">{superAdminEmail}</span>
                </p>
              )}
            </div>
          </div>
          <Button variant="danger" onClick={() => setPending({ kind: 'all' })} disabled={query.isLoading}>
            <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('adminDataReset.masterButton')}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminDataReset.loadError')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {domains.map((domain) => (
            <Card key={domain.key} className="rounded-2xl border-white/[0.08] bg-ase-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ase-text">{domain.label}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={domain.row_count > 0 ? 'warning' : 'default'}>
                      {domain.row_count} {t('adminDataReset.rowsLabel')}
                    </Badge>
                    {domain.is_special && <Badge variant="info">super admin</Badge>}
                  </div>
                  {domain.extra_tables.length > 0 && (
                    <p className="mt-2 text-xs text-ase-muted">
                      {t('adminDataReset.extraTablesLabel')} {domain.extra_tables.join(', ')}
                    </p>
                  )}
                  {domain.key === 'organizations' && (
                    <p className="mt-2 text-xs text-ase-muted">{t('adminDataReset.specialOrgHint')}</p>
                  )}
                  {domain.key === 'users' && (
                    <p className="mt-2 text-xs text-ase-muted">{t('adminDataReset.specialUserHint')}</p>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setPending({ kind: 'domain', domain })}
                  disabled={domain.row_count === 0}
                >
                  {t('adminDataReset.deleteDomainButton')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={pending !== null}
        onClose={closeModal}
        closeLabel={t('adminDataReset.cancel')}
        title={pending?.kind === 'all' ? t('adminDataReset.modalTitleAll') : pending?.domain.label}
        className="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          <div>
            <div className="mb-1 text-ase-muted">{t('adminDataReset.typePhraseLabel')}</div>
            <div className="rounded-lg border border-ase-border bg-ase-bg2 px-3 py-2 font-mono text-xs text-ase-text">
              {expectedPhrase}
            </div>
          </div>
          <div>
            <Input
              value={phraseInput}
              onChange={(e) => setPhraseInput(e.target.value)}
              placeholder={t('adminDataReset.phraseInputPlaceholder')}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="admin-data-reset-password" className="mb-1 block text-xs text-ase-muted">{t('adminDataReset.passwordLabel')}</label>
            <Input
              id="admin-data-reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('adminDataReset.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </div>
          {modalError && <div className="text-xs text-ase-error">{modalError}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              {t('adminDataReset.cancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={!canConfirm}>
              {submitting ? t('adminDataReset.deleting') : t('adminDataReset.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
