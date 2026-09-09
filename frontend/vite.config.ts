/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin =
    env.VITE_API_BACKEND?.replace(/\/$/, '') ||
    'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
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
      },
    },
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
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router') || id.includes('@tanstack')) {
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
    },
  }
})
