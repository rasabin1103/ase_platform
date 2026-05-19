import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-ase-border bg-ase-surface px-3 text-sm text-ase-text placeholder:text-ase-muted',
        'outline-none transition duration-200 ease-out',
        'focus-visible:border-ase-primary/60 focus-visible:ring-2 focus-visible:ring-ase-accent/30 focus-visible:ring-offset-0',
        className,
      )}
      {...props}
    />
  )
}

