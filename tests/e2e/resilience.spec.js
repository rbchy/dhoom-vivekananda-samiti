// When one Supabase table does not answer, the rest of the site keeps working
import { test, expect } from './fixtures.js'

test('events table down: page still loads, other sections still filled', async ({ page, db }) => {
  db.failTable('events')
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('#worship').getByText('Morning aarti')).toBeVisible()
  await expect(page.locator('#events').getByText('Sri Sri Gita Jayanti')).toHaveCount(0)
})

test('institution page with its content table down falls back to the short description', async ({ page, db }) => {
  db.failTable('temple_content')
  await page.goto('/org/ramakrishna')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sree Sree Ramakrishna Mandir')
  await expect(page.locator('.org-mantra')).toHaveCount(0)
})
