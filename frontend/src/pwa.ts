/** Registers the hand-rolled service worker (see public/sw.js) so the
 * dashboard behaves like an installable app (offline app-shell, home-screen
 * icon) instead of just a browser tab. No-ops in dev and in unsupported
 * browsers — never throws, registration failures are logged and swallowed
 * since a missing SW must never block the app from loading. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return // avoids caching interfering with Vite's dev HMR server

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}
