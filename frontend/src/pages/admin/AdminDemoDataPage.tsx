import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Users2 } from 'lucide-react'
import { seedDemoPaidUsers, type SeedDemoUsersResponse } from '../../api/adminDemoData.api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { useI18n } from '../../i18n'

export function AdminDemoDataPanel() {
  const { t } = useI18n()
  const [result, setResult] = useState<SeedDemoUsersResponse | null>(null)

  const mutation = useMutation({
    mutationFn: seedDemoPaidUsers,
    onSuccess: (data) => setResult(data),
  })

  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Users2 className="mt-0.5 h-6 w-6 shrink-0 text-ase-primary" strokeWidth={1.75} />
            <div>
              <div className="text-base font-semibold text-ase-text">{t('adminDemoData.actionTitle')}</div>
              <p className="mt-1 max-w-xl text-sm text-ase-text2">{t('adminDemoData.actionSubtitle')}</p>
            </div>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? t('adminDemoData.creating') : t('adminDemoData.createButton')}
          </Button>
        </div>

        {mutation.isError && (
          <div className="mt-4 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
            {t('adminDemoData.error')}
          </div>
        )}
      </Card>

      {result && (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6">
          <div className="text-sm font-semibold text-ase-text">{t('adminDemoData.resultTitle')}</div>
          <p className="mt-1 text-sm text-ase-text2">{result.note}</p>
          <div className="mt-3 rounded-lg border border-ase-border bg-ase-bg2 px-3 py-2 font-mono text-xs text-ase-text">
            {t('adminDemoData.passwordLabel')} {result.demo_password}
          </div>
          <div className="mt-4">
            <Table>
              <THead>
                <TR>
                  <TH>{t('adminDemoData.columns.email')}</TH>
                  <TH>{t('adminDemoData.columns.plan')}</TH>
                  <TH>{t('adminDemoData.columns.itemsGranted')}</TH>
                  <TH>{t('adminDemoData.columns.status')}</TH>
                </TR>
              </THead>
              <TBody>
                {result.accounts.map((a) => (
                  <TR key={a.email}>
                    <TD className="font-mono text-xs">{a.email}</TD>
                    <TD>
                      {a.plan_name ? (
                        a.plan_name
                      ) : (
                        <Badge variant="default">{t('adminDemoData.freePlan')}</Badge>
                      )}
                    </TD>
                    <TD>{a.catalog_items_granted}</TD>
                    <TD>
                      {a.already_existed ? (
                        <Badge variant="default">{t('adminDemoData.badges.existing')}</Badge>
                      ) : (
                        <Badge variant="success">{t('adminDemoData.badges.created')}</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
