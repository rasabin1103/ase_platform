import { defineConfig, devices } from '@playwright/test'

/**
 * Tests E2E en navegador. Necesitan la web y el backend en marcha contra una
 * base de datos LOCAL (ver e2e/README.md):
 *   E2E_BASE_URL   web ya arrancada; si no se indica, se sirve el build de
 *                  producción con `vite preview` en http://127.0.0.1:4173
 *                  (`npm run e2e:academy` hace antes el build). El servidor de
 *                  desarrollo es demasiado lento con varios navegadores a la vez.
 *   DATABASE_URL   Postgres local del backend (lo usa scripts/e2e_academy.py)
 *   E2E_PYTHON     intérprete con las dependencias del backend (por defecto python3)
 *   CHROMIUM_PATH  Chromium ya instalado (opcional; si no, `npx playwright install chromium`)
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS ?? 3),
  retries: 0,
  timeout: 30 * 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npx vite preview', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
})
