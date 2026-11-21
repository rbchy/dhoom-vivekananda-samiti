// End-to-end tests: npm run test:e2e
// Builds the real website against a fake Supabase address, serves it with `vite preview`
// and runs tests/e2e in Chromium on a desktop and a phone screen. No real database is used.
import { defineConfig, devices } from '@playwright/test'
import { SUPABASE_URL } from './tests/e2e/support/fakeSupabase.js'

const PORT = 4173
// Optional: a Chromium already on the machine (e.g. PW_CHROMIUM_PATH=/path/to/chrome)
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    timezoneId: 'Asia/Dhaka',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions }, testMatch: /(home|search|menu|org-pages|visits-bhavadhara|donors-committee|hero|images)\.spec\.js/, grepInvert: /@desktop-only/ }
  ],
  webServer: {
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key' }
  }
})
