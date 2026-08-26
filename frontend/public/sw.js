/* ASE Platform service worker — hand-rolled (no Workbox/build-tool dependency,
 * keeps the "no paid/third-party services" constraint trivially true).
 *
 * Strategy, deliberately conservative because most of the app is a live,
 * authenticated SPA where staleness is worse than a cache miss:
 *  - Never touch API calls (`/api/*`) or the health check — always network,
 *    so auth/data is never served stale from a cache.
 *  - Same-origin static assets (hashed JS/CSS/fonts/images emitted by Vite)
 *    use a cache-first strategy — filenames are content-hashed, so a cache
 *    hit is always correct, and it's what makes repeat loads feel instant.
 *  - Navigation requests (full-page loads) use network-first with a cached
 *    app-shell (`/index.html`) fallback, so a stale connection or briefly
 *    offline tab still opens the shell instead of the browser's offline page.
 *  - Old cache versions are purged on activate.
 */

const CACHE_VERSION = 'ase-cache-v1'
const APP_SHELL_URL = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([APP_SHELL_URL, '/'])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/health')
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isApiRequest(url)) return // never intercept — always fresh

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_SHELL_URL).then((res) => res ?? fetch(request))),
    )
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
  }
})
