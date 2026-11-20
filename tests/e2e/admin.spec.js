// Admin area: guarded routes and the login form (fake Supabase Auth)
import { test, expect } from './fixtures.js'

test('/admin and the dashboard send a visitor to the login page', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Admin Login')
})

test('the form checks the email and password before asking Supabase', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('admin@')
  await page.getByLabel('Password').fill('123')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('wrong password: a clear message, no session', async ({ page, db }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page.getByText('Email or password is incorrect.')).toBeVisible()
  expect(db.signedIn).toBeNull()
})

test('a real account without a staff role is refused and signed out again', async ({ page, db }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('visitor@example.com')
  await page.getByLabel('Password').fill('visitor-pass')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page.getByText('You are not authorized to use the admin panel.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login$/)
  expect(db.signedIn).toBeNull()
})

test('the main admin reaches the dashboard', async ({ page, db }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByLabel('Password').fill('correct-horse')
  await page.getByRole('button', { name: /log ?in|sign in/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  expect(db.signedIn).toBe('user-main-admin')
})
