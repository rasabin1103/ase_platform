import { Card } from '../ui/Card'
import { cn } from '../ui/cn'

export function AuthCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card
      interactive
      className={cn(
        'w-full max-w-md rounded-3xl border-white/10 bg-ase-surface/65 p-9 backdrop-blur',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.60)]',
        className,
      )}
    >
      {children}
    </Card>
  )
}

