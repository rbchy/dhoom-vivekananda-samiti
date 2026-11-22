// Search-engine tags kept up to date while moving between pages (RouteSeo in src/main.jsx)
import { test, expect } from './fixtures.js'

test('each public page gets its own description and canonical link', async ({ page }) => {
  await page.goto('/calendar')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /festival calendar/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/calendar$/)
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)

  await page.goto('/org/clinic')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /community clinic/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/org\/clinic$/)
})

test('admin pages are hidden from search engines', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})
