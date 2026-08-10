import type { TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        'min-h-[96px] w-full resize-y rounded-xl border border-white/10 bg-ase-bg2/60 px-4 py-3 text-sm text-ase-text outline-none backdrop-blur',
        'placeholder:text-ase-muted/80',
        'focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_34px_rgba(0,0,0,0.32)]',
        className,
      )}
      {...props}
    />
  )
}

