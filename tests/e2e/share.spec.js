// The round Share button: on a computer it opens our share panel instead of failing silently
import { test, expect } from './fixtures.js'

test('share button opens a panel with WhatsApp, Facebook, Email and Copy link @desktop-only', async ({ page }) => {
  await page.goto('/')
  const share = page.locator('.hero-connect .social-share')
  await share.click()
  const panel = page.getByRole('dialog', { name: 'Share' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/)
  await expect(panel.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', /facebook\.com\/sharer/)
  await expect(panel.getByRole('link', { name: 'Email' })).toHaveAttribute('href', /^mailto:\?subject=/)
  await panel.getByRole('button', { name: 'Copy link' }).click()
  await expect(panel.getByRole('button', { name: 'Link copied' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

test('when the browser blocks copying, the link is shown to copy by hand @desktop-only', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } })
    document.execCommand = () => false
  })
  await page.goto('/')
  await page.locator('.hero-connect .social-share').click()
  const panel = page.getByRole('dialog', { name: 'Share' })
  await panel.getByRole('button', { name: 'Copy link' }).click()
  await expect(panel.getByText('Copying is blocked in this browser.')).toBeVisible()
  await expect(panel.getByRole('textbox')).toHaveValue(/^http:\/\/localhost:4173\//)
})
