// Main menu: dropdowns on a desktop, accordion on a phone; Smriti Stambha page
import { test, expect } from './fixtures.js'

const INSTITUTIONS = ['Sree Sree Dokkhin Kalika Mandir', 'Sree Sree Basanti Durga Mandir', 'Dhoom Vivekananda Samiti Community Clinic',
  'Sree Sree Shiv Mandir', 'Sree Sree Ramakrishna Mandir', 'Sree Sree GouriShankar Funeral Temple']

test('the Institutions menu lists all six and opens one', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await page.getByRole('button', { name: 'Institutions' }).first().click()
  for (const name of INSTITUTIONS) await expect(page.getByRole('link', { name, exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Sree Sree Basanti Durga Mandir', exact: true }).first().click()
  await expect(page).toHaveURL(/\/org\/durga$|#org-durga$/)
})

test('Smriti Stambha lists the published founders in their order', async ({ page }) => {
  await page.goto('/smriti-stambha')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Smriti Stambha')
  const body = await page.locator('body').innerText()
  expect(body.indexOf('Sri Haripada Chowdhury')).toBeLessThan(body.indexOf('Sri Gopal Chandra Nath'))
  await expect(page.getByText('Hidden Draft Name')).toHaveCount(0)
})
