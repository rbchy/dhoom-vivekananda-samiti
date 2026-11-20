// Site search: keyboard shortcuts, English and Bangla words, jump to the result
import { test, expect } from './fixtures.js'

const searchBox = page => page.getByRole('dialog', { name: 'Search' }).getByRole('searchbox')

async function openSearch(page, isMobile) {
  if (isMobile) await page.getByRole('button', { name: 'Search' }).first().click()
  else await page.keyboard.press('/')
  await expect(searchBox(page)).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#worship').getByText('Morning aarti')).toBeVisible()
})

test('an English word finds the institution and Enter jumps to it', async ({ page, isMobile }) => {
  await openSearch(page, isMobile)
  await searchBox(page).fill('durga')
  const first = page.getByRole('option').first()
  await expect(first).toContainText('Sree Sree Basanti Durga Mandir')
  await searchBox(page).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Search' })).toHaveCount(0)
  await expect(page).toHaveURL(/#org-durga$/)
})

test('a Bangla word finds the same institution while the page is in English', async ({ page, isMobile }) => {
  await openSearch(page, isMobile)
  await searchBox(page).fill('দুর্গা')
  await expect(page.getByRole('option').first()).toContainText('Sree Sree Basanti Durga Mandir')
})

test('events, photos and worship times are found too', async ({ page, isMobile }) => {
  await openSearch(page, isMobile)
  await searchBox(page).fill('gita')
  await expect(page.getByRole('option', { name: /Sri Sri Gita Jayanti/ })).toBeVisible()
  await searchBox(page).fill('kathamrita')
  await expect(page.getByRole('option', { name: /Kathamrita reading/ })).toBeVisible()
})

test('unpublished events are not searchable', async ({ page, isMobile }) => {
  await openSearch(page, isMobile)
  await searchBox(page).fill('draft')
  await expect(page.getByRole('option', { name: /Unpublished draft event/ })).toHaveCount(0)
})

test('nothing found shows a message; Escape closes', async ({ page, isMobile }) => {
  await openSearch(page, isMobile)
  await searchBox(page).fill('zzqxw')
  await expect(page.getByText(/No results for/)).toBeVisible()
  await searchBox(page).press('Escape')
  await expect(page.getByRole('dialog', { name: 'Search' })).toHaveCount(0)
})

test('Ctrl+K opens the search on a desktop', { tag: '@desktop-only' }, async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(searchBox(page)).toBeFocused()
})
