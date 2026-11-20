// Language switcher: 10 languages, Bangla remembered, Arabic right-to-left, no untranslated keys
import { test, expect, chooseLanguage } from './fixtures.js'

const LANGUAGES = ['English', 'বাংলা', 'हिन्दी', '한국어', '日本語', '中文（简体）', 'Español', 'Français', 'العربية', 'Русский']

test('Bangla: page text, <html lang> and the choice survives a reload', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'বাংলা')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ধুম বিবেকানন্দ সমিতি')
  await expect(page.locator('#events').getByText('শ্রীশ্রী গীতা জয়ন্তী').first()).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
})

test('Arabic turns the page right-to-left, English turns it back', async ({ page }) => {
  await page.goto('/')
  await chooseLanguage(page, 'العربية')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await chooseLanguage(page, 'English')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

for (const [index, name] of LANGUAGES.entries()) {
  test(`${name}: the home page shows no raw translation keys`, async ({ page }) => {
    await page.goto('/')
    if (index > 0) await chooseLanguage(page, name)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const text = await page.locator('body').innerText()
    // keys look like nav_home, hours_title, org_type_temple
    const keys = text.match(/\b(?:nav|hours|events?|gallery|org|act|search|cal|f|err|donate|visit|menu|smriti|notices|orgs|acts)_[a-z_]+\b/g) || []
    expect(keys, 'untranslated keys on the page').toEqual([])
  })
}
