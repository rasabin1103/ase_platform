import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, UserRound, FolderGit2 } from 'lucide-react'
import { redeemBookCode, type RedeemResult } from '../../api/bookRedemption.api'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

type FormValues = { code: string; github_username: string }

type Props = {
  /** Called after a successful redemption (e.g. to refresh a "my books" list). */
  onRedeemed?: (book: RedeemResult) => void
  /** Extra content rendered under the form, e.g. a "log in to save this" nudge for anonymous users. */
  footer?: ReactNode
}

/** Shared "paste your book code, get invited to the private repo" form —
 * used both on the public marketing page (works logged-out) and the private
 * dashboard page (also ties the redemption to the account). The redeem call
 * itself sends a GitHub collaborator invitation for the book's repo; the
 * backend decides whether to also tie it to a user based on whether a valid
 * session token is present. */
export function RedeemCodeForm({ onRedeemed, footer }: Props) {
  const { t } = useI18n()
  const [serverError, setServerError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<RedeemResult | null>(null)
  const form = useForm<FormValues>({ defaultValues: { code: '', github_username: '' } })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => redeemBookCode(values.code, values.github_username),
    onSuccess: (result) => {
      setServerError(null)
      setLastResult(result)
      form.reset({ code: '', github_username: '' })
      onRedeemed?.(result)
    },
    onError: (err) => {
      setLastResult(null)
      setServerError(parseApiError(err, t('redeemCode.invalidCode') as string).message)
    },
  })

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ase-text">
        <KeyRound className="h-5 w-5" strokeWidth={1.75} />
        {t('redeemCode.formTitle')}
      </h2>
      <p className="mt-1.5 text-sm text-ase-text2">{t('redeemCode.formHint')}</p>

      <form
        className="mt-5 space-y-3"
        onSubmit={form.handleSubmit((values) => {
          setServerError(null)
          mutation.mutate(values)
        })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="redeem-code" className="mb-1 block text-xs text-ase-muted">{t('redeemCode.codeLabel')}</label>
            <Input
              id="redeem-code"
              placeholder={t('redeemCode.codePlaceholder') as string}
              {...form.register('code', { required: true })}
            />
          </div>
          <div>
            <label htmlFor="redeem-github-username" className="mb-1 block text-xs text-ase-muted">{t('redeemCode.githubUsernameLabel')}</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
              <Input
                id="redeem-github-username"
                className="pl-9"
                placeholder={t('redeemCode.githubUsernamePlaceholder') as string}
                {...form.register('github_username', { required: true })}
              />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {t('redeemCode.submit')}
        </Button>
      </form>

      {serverError ? (
        <div className="mt-4 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
          {serverError}
        </div>
      ) : null}

      {lastResult ? (
        <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-4">
          <div className="text-sm font-semibold text-ase-text">
            {t('redeemCode.success')} — {lastResult.title}
          </div>
          <p className="mt-1.5 text-sm text-ase-text2">
            {lastResult.invite_status === 'invited' ? t('redeemCode.invitedHint') : t('redeemCode.alreadyCollaboratorHint')}
          </p>
          <a href={lastResult.repo_url} target="_blank" rel="noreferrer" className="mt-3 inline-block">
            <Button size="sm">
              <FolderGit2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              {t('redeemCode.openRepo')}
            </Button>
          </a>
        </div>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Card>
  )
}
