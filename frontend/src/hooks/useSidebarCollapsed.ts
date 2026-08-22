import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ase_sidebar_collapsed'

// Tailwind's `lg` breakpoint — below this the sidebar renders as an
// off-canvas overlay (see Sidebar.tsx), above it as an in-flow column that
// can be narrowed to w-0. Kept in sync with the `lg:` classes there.
const DESKTOP_BREAKPOINT_PX = 1024

function persist(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {
    // ignore — worst case the preference doesn't survive a reload
  }
}

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === '1'
  } catch {
    // localStorage unavailable — fall through to the viewport-based default
  }
  // No saved preference yet: default to collapsed on phone/tablet widths so
  // the first time someone opens the private area on a phone, the sidebar
  // doesn't render open and push the actual page content off-screen.
  return typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT_PX
}

/** Persists whether the private-area sidebar is hidden, so the choice
 * survives reloads/navigation — same read-eagerly/write-in-try-catch
 * pattern as i18n's language preference. Called once in AppLayout, which
 * passes `collapsed`/`toggle`/`close` down as props to Sidebar (renders the
 * collapse/overlay) and Header (renders the toggle button) — calling this
 * hook independently in each component would give them disconnected state. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      persist(next)
      return next
    })
  }, [])

  // Explicit "hide" for the mobile overlay: tapping the backdrop or a nav
  // link should close the drawer without requiring a second tap on the
  // toggle button. Distinct from `toggle` since those call sites always
  // want "closed", not "flip whatever it currently is".
  const close = useCallback(() => {
    setCollapsed(true)
    persist(true)
  }, [])

  return { collapsed, toggle, close }
}
