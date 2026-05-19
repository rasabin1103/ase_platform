import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean
}

export function Skeleton({ className, shimmer = true, ...props }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-white/5 bg-white/5',
        shimmer && 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_infinite]',
        shimmer &&
          'after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent',
        className,
      )}
      {...props}
    />
  )
}

