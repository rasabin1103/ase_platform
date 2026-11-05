import { useEffect, useState, type RefObject } from 'react'
import { usePrefersReducedMotion } from '../../../utils/usePrefersReducedMotion'

const EXPLODE_END = 0.3
const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Progreso de scroll de una escena «pegajosa». Escribe `--p` (0 = capas juntas,
 * 1 = vista explosionada) directamente en el elemento, sin re-render, y devuelve
 * el índice de la capa activa (-1 mientras se abre). Sin scroll-jacking: solo
 * lee la posición. En pantallas estrechas o con reduced-motion la escena queda
 * abierta y estática (`interactive = false`).
 */
export function useSceneProgress(ref: RefObject<HTMLElement | null>, layerCount: number) {
  const reduced = usePrefersReducedMotion()
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [activeRaw, setActive] = useState(-1)
  const interactive = wide && !reduced

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!interactive) {
      el.style.setProperty('--p', '1')
      return
    }
    let raf = 0
    let last = -2
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      if (total <= 0) return
      const p = Math.min(1, Math.max(0, -r.top / total))
      el.style.setProperty('--p', smooth(Math.min(1, p / EXPLODE_END)).toFixed(3))
      const step =
        p < EXPLODE_END ? -1 : Math.min(layerCount - 1, Math.floor(((p - EXPLODE_END) / (1 - EXPLODE_END)) * layerCount))
      if (step !== last) {
        last = step
        setActive(step)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref, interactive, layerCount])

  return { active: interactive ? activeRaw : -1, interactive }
}
