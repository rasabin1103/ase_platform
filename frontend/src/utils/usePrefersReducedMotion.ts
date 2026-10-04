import { useEffect, useState } from 'react'

/** Tracks the `prefers-reduced-motion: reduce` media query so components
 * can swap decorative/entry animations and count-up effects for static
 * final values — see frontend accessibility re-audit (reduced-motion
 * finding): previously only html scroll-behavior respected this. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
