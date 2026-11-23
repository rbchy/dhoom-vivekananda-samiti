// Unit tests for the send-receipt logic — run with:  node --test supabase/functions/send-receipt/lib.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { handleSendReceipt, validateRequest } from './lib.js'
import { amountInWords, bdMobile, bnWords, receiptSms, receiptText, subscriptionReceiptNo } from './receipt-text.js'

const DONATION = { id: 'd1', status: 'verified', receipt_no: 'DVS-20261123-101500', donated_on: '2026-11-23', donor_name: 'শ্রী সুধীর আচার্য',
  email: 'sudhir@example.com', phone: '01712-345678', amount: 12550, currency: 'BDT', method: 'bkash', transaction_ref: 'BK7Q2X9', purpose: 'শ্যামাপূজা' }
const FULL = { resendKey: 're_test', emailFrom: 'Samiti <receipt@example.org>', smsKey: 'sms_test' }

function fakeServices({ emailFails, smsFails } = {}) {
  const calls = []
  const fetchFn = async (url, options = {}) => {
    calls.push({ url, options })
    if (url.includes('resend.com')) return emailFails ? { ok: false, status: 422, json: async () => ({ message: 'domain not verified' }) } : { ok: true, status: 200, json: async () => ({ id: 'email_1' }) }
    if (url.includes('sms.net.bd')) return { ok: true, status: 200, json: async () => (smsFails ? { error: 405, msg: 'Insufficient balance' } : { error: 0, msg: 'ok', data: { request_id: 77 } }) }
    throw new Error('unexpected ' + url)
  }
  return { calls, fetchFn }
}

function deps({ role = 'accounts_admin', earning = DONATION, sent = [], config = FULL, services = fakeServices() } = {}) {
  const logs = []
  return { logs, services, d: {
    fetchFn: services.fetchFn, config,
    getRole: async () => role,
    loadEarning: async () => earning,
    alreadySent: async (type, id, channel) => sent.includes(channel),
    log: async entry => logs.push(entry)
  } }
}

const req = extra => ({ type: 'donation', id: 'd1', channels: ['email', 'sms'], ...extra })

test('Bangla amount in words', () => {
  assert.equal(bnWords(12550), 'বারো হাজার পাঁচ শত পঞ্চাশ')
  assert.equal(bnWords(2500000), 'পঁচিশ লক্ষ')
  assert.equal(bnWords(105), 'এক শত পাঁচ')
  assert.equal(amountInWords(500.5), 'পাঁচ শত টাকা পঞ্চাশ পয়সা মাত্র')
})

test('Bangladeshi mobile numbers', () => {
  assert.equal(bdMobile('01712-345678'), '8801712345678')
  assert.equal(bdMobile('+880 1812 381544'), '8801812381544')
  assert.equal(bdMobile('+1 (267) 342-5565'), '')
})

test('subscription receipt numbers are stable and start with DVS', () => {
  assert.equal(subscriptionReceiptNo({ id: 'ab12cd34-0000', month: '2026-11-01' }), 'DVS-MS-202611-AB12CD')
})

test('request validation', () => {
  assert.deepEqual(validateRequest(req()), [])
  assert.ok(validateRequest(req({ type: 'gift' })).length)
  assert.ok(validateRequest(req({ channels: [] })).length)
  assert.ok(validateRequest(req({ email: 'not-an-email' })).length)
})

test('only staff may send', async () => {
  const { d } = deps({ role: null })
  assert.equal((await handleSendReceipt(req(), d)).status, 403)
})

test('a donation must be verified first', async () => {
  const { d } = deps({ earning: { ...DONATION, status: 'pending' } })
  assert.equal((await handleSendReceipt(req(), d)).status, 409)
})

test('sends e-mail and SMS and logs both', async () => {
  const { d, logs, services } = deps()
  const out = await handleSendReceipt(req({ auto: true }), d)
  assert.equal(out.status, 200)
  assert.deepEqual(out.body.results.map(r => [r.channel, r.status, r.to]), [['email', 'sent', 'sudhir@example.com'], ['sms', 'sent', '8801712345678']])
  const email = JSON.parse(services.calls[0].options.body)
  assert.equal(email.to[0], 'sudhir@example.com')
  assert.match(email.subject, /DVS-20261123-101500/)
  assert.match(email.html, /বারো হাজার পাঁচ শত পঞ্চাশ টাকা মাত্র/)
  const sms = new URLSearchParams(services.calls[1].options.body)
  assert.equal(sms.get('to'), '8801712345678')
  assert.match(sms.get('msg'), /DVS-20261123-101500/)
  assert.equal(logs.length, 2)
  assert.ok(logs.every(l => l.automatic === true && l.receipt_no === 'DVS-20261123-101500'))
})

test('skips channels that are not set up, without contacting anyone', async () => {
  const { d, logs, services } = deps({ config: { smsKey: 'sms_test' } })
  const out = await handleSendReceipt(req(), d)
  assert.equal(out.body.results[0].status, 'skipped')
  assert.equal(out.body.results[1].status, 'sent')
  assert.equal(services.calls.length, 1)
  assert.equal(logs.length, 1)
})

test('skips a donor without contact details', async () => {
  const { d } = deps({ earning: { ...DONATION, email: null, phone: '+1 267 342 5565' } })
  const out = await handleSendReceipt(req(), d)
  assert.deepEqual(out.body.results.map(r => r.status), ['skipped', 'skipped'])
})

test('does not send the same receipt twice unless asked', async () => {
  const { d, services } = deps({ sent: ['email'] })
  const out = await handleSendReceipt(req(), d)
  assert.equal(out.body.results[0].status, 'skipped')
  assert.equal(services.calls.length, 1)
  const again = deps({ sent: ['email'] })
  const forced = await handleSendReceipt(req({ force: true }), again.d)
  assert.equal(forced.body.results[0].status, 'sent')
})

test('a failure in one channel does not stop the other', async () => {
  const { d, logs } = deps({ services: fakeServices({ emailFails: true }) })
  const out = await handleSendReceipt(req(), d)
  assert.equal(out.status, 207)
  assert.equal(out.body.results[0].status, 'failed')
  assert.match(out.body.results[0].error, /domain not verified/)
  assert.equal(out.body.results[1].status, 'sent')
  assert.deepEqual(logs.map(l => l.status), ['failed', 'sent'])
})

test('SMS gateway errors are reported', async () => {
  const { d } = deps({ services: fakeServices({ smsFails: true }) })
  const out = await handleSendReceipt(req({ channels: ['sms'] }), d)
  assert.match(out.body.results[0].error, /Insufficient balance/)
})

test('receipt texts carry the receipt number and amount', () => {
  const d = { ...DONATION, fund_name: 'সমিতি (সাধারণ তহবিল)' }
  assert.match(receiptText(d), /রসিদ নং: DVS-20261123-101500/)
  assert.match(receiptSms(d), /৳ ১২,৫৫০/)
  assert.ok(receiptSms(d).length < 200)
})
