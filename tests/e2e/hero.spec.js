// Banner slideshow: Thakur, Ma and Swamiji take turns; the caption follows in Bangla
import { test, expect, chooseLanguage } from './fixtures.js'

test('the banner turns to Ma and Swamiji, and the dots choose a picture', async ({ page }) => {
  await page.goto('/')
  await page.clock.install({ time: new Date('2026-11-20T10:00:00+06:00') })
  await page.reload()
  const dots = page.locator('.hero-dots button')
  await expect(dots).toHaveCount(3)
  await expect(page.locator('.hero-slide.active')).toHaveCount(0)
  await page.clock.runFor(7500)
  await expect(page.locator('.hero-slide.active')).toHaveAttribute('style', /hero-banner-sarada/)
  await page.getByRole('button', { name: 'Swami Vivekananda' }).click()
  await expect(page.locator('.hero-slide.active')).toHaveAttribute('style', /hero-banner-vivekananda/)
  await page.getByRole('button', { name: 'Sri Ramakrishna' }).click()
  await expect(page.locator('.hero-slide.active')).toHaveCount(0)
})

test('in Bangla the caption under the banner follows the picture', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'বাংলা')
  await expect(page.locator('.hero-caption')).toContainText('যত মত')
  await page.getByRole('button', { name: 'শ্রীশ্রী মা সারদা দেবী' }).click()
  await expect(page.locator('.hero-caption')).toContainText('কেউ পর নয়, মা')
})

test('the sayings are translated: Hindi caption follows the picture', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'हिन्दी')
  await expect(page.locator('.hero-caption')).toContainText('जितने मत')
  await page.getByRole('button', { name: 'स्वामी विवेकानन्द' }).click()
  await expect(page.locator('.hero-caption')).toContainText('उठो, जागो')
  await page.getByRole('button', { name: 'श्री माँ सारदा देवी' }).click()
  await expect(page.locator('.hero-caption')).toContainText('कोई पराया नहीं है')
})

test('changing the language keeps the picture that is showing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Swami Vivekananda' }).click()
  await chooseLanguage(page, 'বাংলা')
  await expect(page.locator('.hero-slide.active')).toHaveAttribute('style', /hero-banner-vivekananda/)
  await expect(page.locator('.hero-caption')).toContainText('ওঠো, জাগো')
})
