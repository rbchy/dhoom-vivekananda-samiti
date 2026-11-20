// Home page: what a visitor sees, read from Supabase (fake) through the real supabase-js client
import { test, expect } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('opens with the Samiti name and the six institutions', async ({ page }) => {
  await expect(page).toHaveTitle(/Dhoom Vivekananda Samiti/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to Dhoom Vivekananda Samiti')
  const institutions = page.locator('#organisations')
  for (const name of ['Sree Sree Dokkhin Kalika Mandir', 'Sree Sree Basanti Durga Mandir', 'Dhoom Vivekananda Samiti Community Clinic',
    'Sree Sree Shiv Mandir', 'Sree Sree Ramakrishna Mandir', 'Sree Sree GouriShankar Funeral Temple']) {
    await expect(institutions.getByText(name, { exact: true }).first()).toBeVisible()
  }
})

test('worship hours show active rows only and mark today (Friday)', async ({ page }) => {
  const hours = page.locator('#worship')
  await expect(hours.getByText('Morning aarti')).toBeVisible()
  await expect(hours.getByText('Kathamrita reading')).toBeVisible()
  await expect(hours.getByText('Hidden row')).toHaveCount(0)
  const today = hours.locator('tr.today')
  await expect(today).toHaveCount(1)
  await expect(today.getByRole('rowheader')).toContainText('Friday')
})

test('events: published and upcoming only, soonest first, link to the calendar', async ({ page }) => {
  const events = page.locator('#events')
  const titles = events.getByRole('heading', { level: 3 })
  await expect(titles.first()).toHaveText('Sri Sri Gita Jayanti')
  await expect(events.getByText('Kalpataru Utsav')).toBeVisible()
  await expect(events.getByText('Unpublished draft event')).toHaveCount(0)
  await events.getByRole('link', { name: /full festival calendar/i }).click()
  await expect(page).toHaveURL(/\/calendar$/)
})

test('gallery filters by category and by institution', async ({ page }) => {
  const gallery = page.locator('#gallery')
  const photos = gallery.locator('.gallery-grid img, .gallery-item img')
  await expect(photos).toHaveCount(4)
  await gallery.getByRole('button', { name: 'Festivals', exact: true }).click()
  await expect(photos).toHaveCount(2)
  await gallery.getByRole('button', { name: 'All', exact: true }).click()
  await gallery.getByRole('button', { name: 'Sree Sree Shiv Mandir', exact: true }).click()
  await expect(photos).toHaveCount(1)
  await expect(photos.first()).toHaveAttribute('alt', /Ganga Devi/)
})

test('notice board shows the published announcement', async ({ page }) => {
  await expect(page.getByText('Evening aarti every day').first()).toBeVisible()
})
