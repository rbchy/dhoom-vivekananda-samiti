// Shared set-up for every test:
//   - the fake Supabase is installed before the page loads (fixture `db`)
//   - the clock is frozen at TODAY so dates in the tests never drift
//   - any other internet request (maps, fonts, social widgets) is blocked, so the run is offline
//   - an uncaught JavaScript error on the page fails the test
import { test as base, expect } from '@playwright/test'
import { installFakeSupabase, SUPABASE_URL } from './support/fakeSupabase.js'
import { TODAY } from './support/data.js'

export const test = base.extend({
  db: [async ({ page }, use) => {
    await page.route(url => !['localhost', '127.0.0.1'].includes(url.hostname) && !url.href.startsWith(SUPABASE_URL), route => route.abort())
    const db = await installFakeSupabase(page)
    await page.clock.setFixedTime(new Date(TODAY))
    await use(db)
  }, { auto: true }],

  pageErrors: [async ({ page }, use) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
    expect(errors, 'uncaught errors on the page').toEqual([])
  }, { auto: true }]
})

export { expect }

// Open the language menu and choose a language by its own name (e.g. "বাংলা")
export async function chooseLanguage(page, nativeName) {
  await page.locator('.lang-button').first().click()
  await page.getByRole('option', { name: nativeName }).click()
}
