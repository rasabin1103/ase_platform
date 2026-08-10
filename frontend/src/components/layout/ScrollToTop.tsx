import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll to top on route change (instant).
 * Anchor/hash smooth scroll is handled via `html { scroll-behavior: smooth }` in index.css.
 * See DESIGN.md § Scroll.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
