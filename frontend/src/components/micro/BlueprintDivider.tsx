import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn'

export function BlueprintDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [draw, setDraw] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDraw(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('pointer-events-none absolute inset-x-0 top-0', className)} aria-hidden>
      <svg viewBox="0 0 1200 2" preserveAspectRatio="none" className="h-[2px] w-full">
        <path
          d="M0 1 H1200"
          className={cn('stroke-white/10 transition-[stroke-dashoffset] duration-700 ease-out')}
          strokeDasharray={1200}
          strokeDashoffset={draw ? 0 : 1200}
          fill="none"
        />
      </svg>
    </div>
  )
}

