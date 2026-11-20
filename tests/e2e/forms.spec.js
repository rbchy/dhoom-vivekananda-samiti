// Public forms: what is checked in the browser, and exactly what is sent to Supabase
import { test, expect } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('contact message', () => {
  async function open(page) {
    await page.getByRole('button', { name: 'Send us a message' }).click()
    return page.getByRole('dialog')
  }

  test('empty form: every required field is flagged and nothing is sent', async ({ page, db }) => {
    const form = await open(page)
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByRole('alert').first()).toHaveText('Please correct the highlighted fields.')
    await expect(form.getByLabel('Full name *')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Email address *')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Message *')).toHaveAttribute('aria-invalid', 'true')
    expect(db.writes).toEqual([])
  })

  test('bad email and letters in the phone number are rejected', async ({ page, db }) => {
    const form = await open(page)
    await form.getByLabel('Full name *').fill('Ranajit')
    await form.getByLabel('Email address *').fill('not-an-email')
    await form.getByLabel('Phone number').fill('call me')
    await form.getByLabel('Message *').fill('Please send the puja timings.')
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByText('Please enter a valid email address.')).toBeVisible()
    await expect(form.getByLabel('Phone number')).toHaveAttribute('aria-invalid', 'true')
    expect(db.writes).toEqual([])
  })

  test('valid message is sent once, trimmed, with status "new"', async ({ page, db }) => {
    const form = await open(page)
    await form.getByLabel('Full name *').fill('  Ranajit Chowdhury  ')
    await form.getByLabel('Email address *').fill('devotee@example.com ')
    await form.getByLabel('Message *').fill('  When does the Gita Jayanti puja start?  ')
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByRole('status')).toBeVisible()
    expect(db.writes).toHaveLength(1)
    expect(db.writes[0]).toMatchObject({ table: 'contact_messages', method: 'POST' })
    expect(db.writes[0].body).toEqual({
      name: 'Ranajit Chowdhury', email: 'devotee@example.com', phone: null,
      subject: null, message: 'When does the Gita Jayanti puja start?', status: 'new'
    })
  })

  test('server error: the visitor is told and the text is kept', async ({ page, db }) => {
    db.failTable('contact_messages')
    const form = await open(page)
    await form.getByLabel('Full name *').fill('Ranajit')
    await form.getByLabel('Email address *').fill('devotee@example.com')
    await form.getByLabel('Message *').fill('This message will fail to send.')
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByRole('alert')).toBeVisible()
    await expect(form.getByLabel('Message *')).toHaveValue('This message will fail to send.')
  })
})

test.describe('online donation', () => {
  async function open(page) {
    await page.getByRole('button', { name: 'Donate Online' }).first().click()
    return page.getByRole('dialog')
  }

  test('the transaction ID is required for bKash', async ({ page, db }) => {
    const form = await open(page)
    await form.getByLabel('Full name *').fill('Ranajit')
    await form.getByLabel('Phone number *').fill('01711 000000')
    await form.getByLabel('Amount *').fill('500')
    await form.getByRole('button', { name: 'Submit donation details' }).click()
    await expect(form.getByLabel(/Transaction ID/)).toHaveAttribute('aria-invalid', 'true')
    expect(db.writes).toEqual([])
  })

  test('a donation is sent as "pending" for the committee to confirm', async ({ page, db }) => {
    const form = await open(page)
    await form.getByLabel('Full name *').fill('Ranajit Chowdhury')
    await form.getByLabel('Phone number *').fill('01711 000000')
    await form.getByLabel('Amount *').fill('1001')
    await form.getByLabel('Purpose').selectOption({ label: 'Gita Jayanti' })
    await form.getByLabel('Payment method *').selectOption('nagad')
    await form.getByLabel(/Transaction ID/).fill('NGD-7788AB')
    await form.getByRole('button', { name: 'Submit donation details' }).click()
    await expect(page.getByRole('status')).toBeVisible()
    expect(db.writes).toHaveLength(1)
    expect(db.writes[0].table).toBe('donations')
    expect(db.writes[0].body).toMatchObject({
      channel: 'online', status: 'pending', donor_name: 'Ranajit Chowdhury', phone: '01711 000000',
      amount: 1001, currency: 'BDT', method: 'nagad', transaction_ref: 'NGD-7788AB',
      purpose: 'Gita Jayanti', event_catalog_id: 'cat-gita', donated_on: '2026-11-20'
    })
    // a visitor can never mark their own donation as verified
    expect(db.writes[0].body).not.toHaveProperty('verified_by')
  })
})
