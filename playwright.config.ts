import { defineConfig, devices } from '@playwright/test'
import { STORAGE_STATE } from './e2e/constants'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'list' : [['html', { open: 'never' }]],
  // Visuals play themselves when scrolled into view, which would race every
  // assertion about which step is showing. Reduced motion switches that off, so
  // specs drive the steps by hand; the one spec that checks autoplay opts back
  // in for itself.
  use: {
    baseURL,
    trace: 'retain-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
})
