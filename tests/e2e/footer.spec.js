// Footer: the Samiti's description and address, with Bangla digits on the Bangla page
import { test, expect, chooseLanguage } from './fixtures.js'

test('footer shows the description and the address', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.site-footer')
  await expect(footer).toContainText('five temples, a community clinic')
  await expect(footer.locator('.footer-address')).toContainText('Mohazanhat-4328')
})

test('in Bangla: ধূম and Bangla digits in the address', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'বাংলা')
  const footer = page.locator('.site-footer')
  await expect(footer).toContainText('শিবজ্ঞানে জীবসেবা')
  await expect(footer.locator('.footer-address')).toHaveText(/ধূম, মহাজনহাট-৪৩২৮/)
})

test('an address saved by the admin is shown, with Bangla digits in Bangla', async ({ page, db }) => {
  db.tables.site_settings.push({ key: 'address', value_en: 'Dhoom, Mohazanhat-4328, Mirsharai', value_bn: 'ধূম, মহাজনহাট-4328, মীরসরাই' })
  await page.goto('/')
  await chooseLanguage(page, 'বাংলা')
  await expect(page.locator('.site-footer .footer-address')).toHaveText(/মহাজনহাট-৪৩২৮, মীরসরাই/)
})
