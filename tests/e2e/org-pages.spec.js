// A page for each institution at /org/<id>
import { test, expect } from './fixtures.js'

const ORGS = {
  'dakshin-kalika': 'Sree Sree Dokkhin Kalika Mandir',
  durga: 'Sree Sree Basanti Durga Mandir',
  clinic: 'Dhoom Vivekananda Samiti Community Clinic',
  shiv: 'Sree Sree Shiv Mandir',
  ramakrishna: 'Sree Sree Ramakrishna Mandir',
  gourishankar: 'Sree Sree GouriShankar Funeral Temple'
}

for (const [id, name] of Object.entries(ORGS)) {
  test(`/org/${id} shows ${name} and marks it in the institution menu`, async ({ page }) => {
    await page.goto(`/org/${id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
    await expect(page).toHaveTitle(`${name} · Dhoom Vivekananda Samiti`)
    const current = page.getByRole('navigation', { name: 'Institutions' }).locator('[aria-current="page"]')
    await expect(current).toHaveText(name)
  })
}

test('published page: full text in paragraphs, pranam mantra and only its own photos', async ({ page }) => {
  await page.goto('/org/ramakrishna')
  const article = page.locator('.org-article')
  await expect(article.locator('> p')).toHaveText(['Daily worship of Sri Ramakrishna.', 'Kathamrita is read every Friday evening.'])
  await expect(page.locator('.org-mantra')).toContainText('Om sthāpakāya cha dharmasya')
  const photos = page.locator('.org-photos img')
  await expect(photos).toHaveCount(2)
  await expect(page.locator('.org-photos')).not.toContainText('Ganga Devi')
})

test('an unpublished draft never reaches the public page', async ({ page }) => {
  await page.goto('/org/shiv')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sree Sree Shiv Mandir')
  await expect(page.getByText('DRAFT TEXT THAT MUST NOT SHOW')).toHaveCount(0)
})

test('Bangla page uses the Bangla text and mantra', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('temple-language', 'bn'))
  await page.goto('/org/ramakrishna')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('শ্রীশ্রী রামকৃষ্ণ মন্দির')
  await expect(page.locator('.org-mantra')).toContainText('ওঁ স্থাপকায় চ ধর্মস্য')
})

test('unknown institution goes back to the home page', async ({ page }) => {
  await page.goto('/org/no-such-temple')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to Dhoom Vivekananda Samiti')
})

test('moving between institutions with the menu', async ({ page }) => {
  await page.goto('/org/ramakrishna')
  await page.getByRole('navigation', { name: 'Institutions' }).getByRole('link', { name: ORGS.clinic }).click()
  await expect(page).toHaveURL(/\/org\/clinic$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ORGS.clinic)
})
