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
          // These libraries are already behind React.lazy() at the
          // component level (DocxViewer, XlsxViewer, MarkdownViewer/blog
          // editor, chart components), so Vite already emits them as
          // separate chunks. What manualChunks adds on top: (1) a stable
          // vendor chunk for React/router/query so app-code changes don't
          // bust the browser cache for framework code, and (2) named,
          // predictable chunks per heavy library instead of leaving Rollup
          // to decide — helpful if two different lazy pages ever pull in
          // the same heavy dependency (e.g. two places import `xlsx`),
          // which would otherwise duplicate it across chunks.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('mammoth')) return 'vendor-docx'
            if (id.includes('/xlsx/')) return 'vendor-xlsx'
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf'
            if (id.includes('exceljs')) return 'vendor-exceljs'
            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor'
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
