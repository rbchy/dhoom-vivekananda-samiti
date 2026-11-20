// Festival calendar at /calendar (browser clock frozen at 20 Nov 2026)
import { test, expect } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/calendar')
})

test('opens on the current month; yearly festivals without a date are listed', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Festival Calendar')
  await expect(page.getByRole('heading', { level: 2, name: 'November 2026' })).toBeVisible()
  await expect(page.locator('.cal-side')).toContainText('Shyama Puja')
  await expect(page.locator('.cal-side')).toContainText('Date to be announced')
})

test('next month shows the dated festival on its day, not twice', async ({ page }) => {
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'December 2026' })).toBeVisible()
  const chip = page.locator('.cal-chip', { hasText: 'Sri Sri Gita Jayanti' })
  await expect(chip).toHaveCount(1)
  await expect(page.locator('.cal-cell', { has: chip }).locator('.cal-day')).toHaveText('1')
  // the catalog entry "Gita Jayanti" is the same festival: it is not listed again as "date to be announced"
  await expect(page.locator('.cal-side').getByText('Date to be announced')).toHaveCount(0)
})

test('Today brings the calendar back; the year overview jumps to a month', async ({ page }) => {
  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'September 2026' })).toBeVisible()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'November 2026' })).toBeVisible()
  await page.locator('.cal-year-month', { hasText: 'October' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'October 2026' })).toBeVisible()
})

test('festival details and an add-to-calendar (.ics) file', async ({ page }) => {
  await page.getByRole('button', { name: 'Next month' }).click()
  await page.locator('.cal-chip', { hasText: 'Sri Sri Gita Jayanti' }).click()
  const detail = page.locator('.cal-detail')
  await expect(detail).toContainText('Annual festival · Mokshada Ekadashi')
  await expect(detail).toContainText('Sree Sree Ramakrishna Mandir')

  const download = page.waitForEvent('download')
  await detail.locator('.cal-add').click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.ics$/)
  const ics = await (await file.createReadStream()).toArray().then(parts => Buffer.concat(parts).toString('utf8'))
  expect(ics).toContain('BEGIN:VCALENDAR')
  expect(ics).toContain('SUMMARY:Sri Sri Gita Jayanti')
  expect(ics).toMatch(/DTSTART[^:]*:20261201/)
})
