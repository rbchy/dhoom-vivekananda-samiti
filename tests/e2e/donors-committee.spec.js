// Honoured donors (/donors) and the Samiti committee (/committee)
import { test, expect, chooseLanguage } from './fixtures.js'

test('donors: highest first, the first one featured, amount and date shown', async ({ page }) => {
  await page.goto('/donors')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Honoured Donors')
  const featured = page.locator('.dn-featured')
  await expect(featured.getByRole('heading', { level: 2 })).toHaveText('Test Donor First')
  await expect(featured.getByText('Foremost donor')).toBeVisible()
  await expect(featured.getByText('৳15,00,000')).toBeVisible()
  await expect(featured.getByText('January 15, 2022')).toBeVisible()
  await expect(featured.getByText('First Town, Testland')).toBeVisible()
  await expect(featured.getByText('In memory of: Late Test Parent')).toBeVisible()
  await expect(page.locator('.dn-grid h2')).toHaveText(['Test Donor Second', 'Test Land Giver'])
  const land = page.locator('#donor-dh-3')
  await expect(land.getByText('Land for the Durga Mandir')).toBeVisible()
  await expect(land.getByText('Amount')).toHaveCount(0)
})

test('donors: empty list shows a friendly message', async ({ page, db }) => {
  db.tables.donor_honours_public.length = 0
  await page.goto('/donors')
  await expect(page.getByText('The honour board is being prepared.')).toBeVisible()
})

test('donors page in Bangla uses Bangla names and digits', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'বাংলা')
  await page.goto('/donors')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('দাতা সম্মাননা')
  await expect(page.locator('.dn-featured h2')).toHaveText('পরীক্ষা দাতা প্রথম')
  await expect(page.locator('.dn-featured .dn-amount')).toHaveText('৳১৫,০০,০০০')
})

test('committee: current officials in position order, earlier committee below', async ({ page }) => {
  await page.goto('/committee')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Samiti Committee')
  await expect(page.locator('.cm-grid-leaders h3')).toHaveText(['Test President Pi', 'Test Secretary Sigma'])
  await expect(page.getByText('Test Member Mu')).toBeVisible()
  await expect(page.getByText('Hidden Official')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '+880 1700 000000' })).toHaveAttribute('href', 'tel:+8801700000000')
  await expect(page.locator('#cm-now')).toContainText('2025 – 2027')
  await page.getByText('Term 2021 – 2023').click()
  await expect(page.getByText('Test Former President')).toBeVisible()
})

test('the About menu leads to the committee and donors pages', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await page.getByRole('button', { name: 'About' }).first().click()
  await expect(page.getByRole('link', { name: 'Samiti Committee', exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Honoured Donors', exact: true }).first().click()
  await expect(page).toHaveURL(/\/donors$/)
})

test('admin: a donor cannot be shown without consent @desktop-only', async ({ page, db }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByLabel('Password').fill('correct-horse')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await page.getByRole('button', { name: /Honoured Donors/ }).click()
  await page.getByLabel('Donor name (English) *').fill('Admin Added Donor')
  await page.getByLabel('Amount', { exact: true }).fill('100000')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(/Tick "The donor agreed"/).first()).toBeVisible()
  expect(db.writes.filter(w => w.table === 'donor_honours')).toHaveLength(0)
  await page.getByLabel(/agreed to be shown/).check()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Added.')).toBeVisible()
  expect(db.writes.find(w => w.table === 'donor_honours').body).toMatchObject({ name_en: 'Admin Added Donor', amount: 100000, consent: true, show_amount: true })
})
