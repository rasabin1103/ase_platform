import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../../utils/usePrefersReducedMotion'

/** Número que cuenta desde 0 al entrar en pantalla. Respeta reduced-motion. */
export function CountUp({ to }: { to: number }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1400)
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, reduced])

  const shown = reduced || typeof IntersectionObserver === 'undefined' ? to : n
  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  )
}
