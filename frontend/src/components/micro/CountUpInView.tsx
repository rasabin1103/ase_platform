import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../utils/usePrefersReducedMotion'

type Props = {
  value: number
  durationMs?: number
  decimals?: number
  className?: string
  format?: (v: number) => string
}

export function CountUpInView({ value, durationMs = 900, decimals = 0, className, format }: Props) {
  const elRef = useRef<HTMLSpanElement | null>(null)
  const [started, setStarted] = useState(false)
  const [n, setN] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const formatter = useMemo(() => {
    if (format) return format
    const pow = Math.pow(10, decimals)
    return (v: number) => (Math.round(v * pow) / pow).toLocaleString()
  }, [decimals, format])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    // Reduced motion: skip the raf loop entirely — the rendered value below
    // derives straight from `started` in that case, so there's nothing for
    // this effect to drive.
    if (!started || reducedMotion) return
    const start = performance.now()

    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // Slight ease-out
      const eased = 1 - Math.pow(1 - t, 3)
      setN(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value, durationMs, reducedMotion])

  const displayValue = reducedMotion ? (started ? value : 0) : n

  return (
    <span ref={elRef} className={className}>
      {formatter(displayValue)}
    </span>
  )
}

