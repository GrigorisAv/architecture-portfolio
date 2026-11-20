import { defineConfig, devices } from '@playwright/test'

/**
 * site     → prerendered production build (npm run build:static) served like a static host
 * cms-demo → dev server with the browser-only demo CMS
 * Run: npm run test:e2e
 */
const CI = !!process.env.CI

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: CI ? 2 : 3,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['list']] : 'list',
  use: { trace: 'off', screenshot: 'only-on-failure', locale: 'el-GR' },
  projects: [
    { name: 'site', testMatch: /site\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:4173' } },
    { name: 'cms-demo', testMatch: /cms-demo\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:5174' } },
  ],
  webServer: [
    {
      command: 'npm run build:static && npm run serve',
      env: { VITE_SITE_URL: 'http://localhost:4173', PORT: '4173' },
      url: 'http://localhost:4173',
      reuseExistingServer: !CI,
      timeout: 240_000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      env: { VITE_CMS_DEMO: 'true' },
      url: 'http://localhost:5174',
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
  ],
})
