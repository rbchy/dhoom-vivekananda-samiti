// Every uploaded photo becomes a light WebP picture, at most 1600 px wide
import { test, expect } from './fixtures.js'

const PHOTO = new URL('./support/large-photo.png', import.meta.url).pathname

async function openDonorForm(page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByLabel('Password').fill('correct-horse')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await page.getByRole('button', { name: /Honoured Donors/ }).click()
}

async function preparedPhoto(page) {
  const name = page.locator('.image-picker-name').first()
  await expect(name).toContainText(/\.(webp|jpg) \(/, { timeout: 15000 })
  const size = await page.locator('.image-picker-preview').evaluate(img => new Promise(resolve => {
    const done = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.complete && img.naturalWidth ? done() : img.addEventListener('load', done, { once: true })
  }))
  return { text: await name.innerText(), ...size }
}

test('with auto-enhance: a 2400 px PNG becomes a 1600 px WebP @desktop-only', async ({ page }) => {
  await openDonorForm(page)
  await page.locator('#dh-photo').setInputFiles(PHOTO)
  const photo = await preparedPhoto(page)
  expect(photo.text).toMatch(/-enhanced\.webp/)
  expect(photo.w).toBe(1600)
  expect(photo.h).toBe(800)
})

test('without auto-enhance: the photo is still made a 1600 px WebP @desktop-only', async ({ page }) => {
  await openDonorForm(page)
  await page.getByLabel(/Auto-enhance photo/).first().uncheck()
  await page.locator('#dh-photo').setInputFiles(PHOTO)
  const photo = await preparedPhoto(page)
  expect(photo.text).toMatch(/large-photo\.webp/)
  expect(photo.w).toBe(1600)
})
