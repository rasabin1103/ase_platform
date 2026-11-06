/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

/**
 * Python en el navegador (cursos de Python): Pyodide se sirve desde nuestro
 * propio dominio en /pyodide/v<versión>/, copiado del paquete `pyodide` al
 * construir y servido desde node_modules en desarrollo. Así no dependemos de
 * un CDN externo. La versión es la de learn/python/core.ts (PYODIDE_VERSION).
 */
const PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
function pyodideAssets(): Plugin {
  // Relativo a este fichero (no al directorio desde el que se lanza Vite).
  const src = join(fileURLToPath(new URL('.', import.meta.url)), 'node_modules', 'pyodide')
  const version = () => {
    try {
      return (JSON.parse(readFileSync(join(src, 'package.json'), 'utf8')) as { version: string }).version
    } catch {
      return null
    }
  }
  const types: Record<string, string> = { mjs: 'text/javascript', js: 'text/javascript', wasm: 'application/wasm', zip: 'application/zip', json: 'application/json' }
  const serve: Plugin['configureServer'] = (server) => {
    // Sin el paquete instalado no se rompe el servidor: Python no carga y el aviso lo explica.
    if (!version()) server.config.logger.warn('[pyodide] Falta el paquete `pyodide`: ejecuta `npm install` (Python no funcionará en los cursos).')
    server.middlewares.use((req, res, next) => {
      const m = /^\/pyodide\/v[^/]+\/([^/?]+)/.exec(req.url ?? '')
      if (!m) return next()
      const file = join(src, m[1])
      if (!PYODIDE_FILES.includes(m[1]) || !existsSync(file)) {
        res.statusCode = 404
        res.end('pyodide: fichero no encontrado (¿falta `npm install`?)')
        return
      }
      res.setHeader('Content-Type', types[m[1].split('.').pop() ?? ''] ?? 'application/octet-stream')
      createReadStream(file).pipe(res)
    })
  }
  return {
    name: 'ase-pyodide-assets',
    configureServer: serve,
    configurePreviewServer: serve as Plugin['configurePreviewServer'],
    writeBundle(options) {
      const v = version()
      if (!v) throw new Error('[pyodide] Falta el paquete `pyodide` (npm install): sin él los cursos de Python no funcionan.')
      const out = join(options.dir ?? 'dist', `pyodide/v${v}`)
      mkdirSync(out, { recursive: true })
      for (const f of PYODIDE_FILES) copyFileSync(join(src, f), join(out, f))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin =
    env.VITE_API_BACKEND?.replace(/\/$/, '') ||
    'http://localhost:8000'

  const proxy = {
    '/api': {
      target: apiOrigin,
      changeOrigin: true,
      secure: true,
    },
    '/health': {
      target: apiOrigin,
      changeOrigin: true,
      secure: true,
    },
    // sitemap.xml y robots.txt los genera el backend (en producción los
    // publica Vercel con un rewrite, ver vercel.json).
    '/sitemap.xml': { target: apiOrigin, changeOrigin: true, secure: true },
    '/robots.txt': { target: apiOrigin, changeOrigin: true, secure: true },
  }

  return {
    plugins: [react(), pyodideAssets()],
    // PGlite (PostgreSQL en WebAssembly, curso de SQL) carga su .wasm y sus datos
    // con import.meta.url: el pre-empaquetado del servidor de desarrollo lo rompe.
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy,
    },
    // `vite preview` (build de producción en local, p. ej. para los tests E2E) con el mismo proxy.
    preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
    build: {
      rollupOptions: {
        output: {
          // Only React/router/query get a named manual chunk: they're
          // needed on literally every page, so hoisting them into one
          // stable "vendor-react" file is a pure win (app-code changes
          // don't bust the browser cache for framework code).
          //
          // The heavy one-off libraries (xlsx, mammoth, exceljs, recharts,
          // jspdf/html2canvas, tiptap/prosemirror) used to get the same
          // manualChunks treatment, on the theory that naming them
          // explicitly was strictly better than leaving Rolldown to decide.
          // It wasn't: naming a chunk here makes Rolldown treat it as a
          // real, addressable output chunk, and if *any* module reachable
          // from the eager (non-lazy) app shell shares so much as one small
          // dependency edge into that chunk, Rolldown has to preload the
          // *whole* named chunk via <link rel="modulepreload"> in
          // index.html — verified by inspecting the built index.html and
          // the .vite/manifest.json, which showed vendor-charts/vendor-pdf/
          // vendor-editor (~415KB gzip combined) being modulepreloaded on
          // every single page load, including the public login/home pages
          // that never touch a chart, a PDF export, or the blog editor.
          // Removing the manual grouping for just these libraries let
          // Rolldown's own automatic chunking take over — confirmed via the
          // same manifest inspection that each library then lands in its
          // own chunk scoped to its actual lazy-loaded consumer(s) (e.g. a
          // dedicated recharts chunk shared only by the pages that render
          // charts), with nothing preloaded outside of what a given route
          // actually needs.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('react-router') ||
              id.includes('@tanstack')
            ) {
              return 'vendor-react'
            }
            return undefined
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Los E2E del navegador (Playwright) van aparte: npm run e2e.
      exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    },
  }
})
