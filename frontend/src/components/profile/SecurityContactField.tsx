import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'

type Props = {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  inputType?: 'email' | 'tel'
  placeholder?: string
  verified: boolean
  verifyLabel: string
  verifiedLabel: string
  onVerify: () => void
  verifyPending?: boolean
  verifyDisabled?: boolean
  disabled?: boolean
  error?: string
}

export function SecurityContactField({
  label,
  hint,
  value,
  onChange,
  inputType = 'email',
  placeholder,
  verified,
  verifyLabel,
  verifiedLabel,
  onVerify,
  verifyPending,
  verifyDisabled,
  disabled,
  error,
}: Props) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-ase-muted">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'min-w-0 flex-1 rounded-xl border-white/10 bg-ase-bg2/50',
            error && 'border-ase-error/50 ring-1 ring-ase-error/30',
          )}
        />
        {verified ? (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            disabled
          >
            {verifiedLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 text-ase-muted"
            onClick={onVerify}
            disabled={verifyDisabled || verifyPending || !value.trim()}
          >
            {verifyPending ? '…' : verifyLabel}
          </Button>
        )}
      </div>
      {hint ? <p className="mt-2 text-xs text-ase-muted">{hint}</p> : null}
      {error ? <p className="mt-2 text-xs text-ase-error">{error}</p> : null}
    </div>
  )
}
