import { cn } from './cn'
import { useI18n } from '../../i18n'

type Props = {
  label: string
  required?: boolean
  className?: string
}

export function FormFieldLabel({ label, required, className }: Props) {
  const { t } = useI18n()
  return (
    <span className={cn('mb-1 block text-xs text-ase-muted', className)}>
      {label}
      {required ? (
        <span className="ml-0.5 font-semibold text-ase-error" aria-hidden="true">
          *
        </span>
      ) : null}
      {required ? (
        <span className="sr-only"> ({t('adminFormValidation.requiredLegend') as string})</span>
      ) : null}
    </span>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-sm text-ase-error">{message}</p>
}
