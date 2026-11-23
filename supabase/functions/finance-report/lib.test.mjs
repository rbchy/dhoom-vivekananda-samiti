// Unit tests for the account book, periods and the finance-report logic — run with:
//   node --test supabase/functions/finance-report/lib.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLedger, duePeriods, ledgerCsv, periodFor, rangeOf, statementHtml, summarize, todayBD } from './statement.js'
import { cleanRecipients, handleFinanceReport, NUMBERS } from './lib.js'

const V = { verified_at: '2026-11-10T10:00:00Z', verified_by_name: 'Treasurer', verified_role: 'accounts_admin' }
const DATA = {
  heads: [{ head_type: 'expense', code: 'puja_materials', label: 'Puja materials — পূজার সামগ্রী' }, { head_type: 'income', code: 'pranami', label: 'Pranami — প্রণামী' }],
  donations: [
    { id: 'd1', status: 'verified', channel: 'office', donated_on: '2026-11-03', donor_name: 'A', amount: 1000, currency: 'BDT', method: 'cash', receipt_no: 'DVS-1' },
    { id: 'd2', status: 'pending', channel: 'online', donated_on: '2026-11-04', donor_name: 'B', amount: 999, currency: 'BDT', method: 'bkash' },
    { id: 'd0', status: 'verified', channel: 'online', donated_on: '2026-10-20', donor_name: 'C', amount: 500, currency: 'BDT', method: 'bkash', receipt_no: 'DVS-0' }
  ],
  subscriptions: [{ id: 's1', donor_name: 'Subscriber One' }],
  subPayments: [{ id: 'ab12cd34', subscription_id: 's1', month: '2026-11-01', paid_on: '2026-11-05', amount: 200, currency: 'BDT', method: 'nagad', ...V }],
  income: [{ id: 'i1', entry_date: '2026-11-12', category: 'pranami', description: 'Donation box', amount: 300, currency: 'BDT', method: 'cash', receipt_no: 'DVS-INC-1', ...V },
    { id: 'i2', entry_date: '2026-11-13', category: 'pranami', description: 'Not checked yet', amount: 50, currency: 'BDT', method: 'cash', receipt_no: 'DVS-INC-2' }],
  expenses: [{ id: 'e1', expense_date: '2026-11-08', category: 'puja_materials', description: 'Flowers', paid_to: 'Shop', amount: 400, currency: 'BDT', method: 'cash', voucher_no: 'EXP-1', ...V },
    { id: 'e0', expense_date: '2026-10-25', category: 'puja_materials', description: 'Incense', amount: 100, currency: 'BDT', method: 'cash', voucher_no: 'EXP-0', ...V }]
}

test('periods: fortnights, months, quarters, financial year', () => {
  assert.deepEqual(periodFor('fortnight', '2026-11-10'), ['2026-11-01', '2026-11-15'])
  assert.deepEqual(periodFor('fortnight', '2026-11-20'), ['2026-11-16', '2026-11-30'])
  assert.deepEqual(periodFor('last_fortnight', '2026-11-01'), ['2026-10-16', '2026-10-31'])
  assert.deepEqual(periodFor('last_fortnight', '2026-03-16'), ['2026-03-01', '2026-03-15'])
  assert.deepEqual(periodFor('last_fortnight', '2026-03-01'), ['2026-02-16', '2026-02-28'])
  assert.deepEqual(periodFor('last_month', '2026-01-01'), ['2025-12-01', '2025-12-31'])
  assert.deepEqual(periodFor('last_quarter', '2026-01-01'), ['2025-10-01', '2025-12-31'])
  assert.deepEqual(periodFor('fiscal_year', '2026-11-23'), ['2026-07-01', '2027-06-30'])
  assert.deepEqual(periodFor('last_fiscal_year', '2026-07-01'), ['2025-07-01', '2026-06-30'])
  assert.deepEqual(rangeOf('last_half_year', '2026-07-01'), ['2026-01-01', '2026-06-30'])
})

test('Bangladesh date', () => {
  assert.equal(todayBD(new Date('2026-11-30T19:00:00Z')), '2026-12-01')
})

test('what the scheduler prepares on which day', () => {
  assert.deepEqual(duePeriods('2026-11-16'), ['last_fortnight'])
  assert.deepEqual(duePeriods('2026-11-01'), ['last_fortnight', 'last_month'])
  assert.deepEqual(duePeriods('2026-07-01'), ['last_fortnight', 'last_month', 'last_quarter', 'last_half_year', 'last_fiscal_year'])
  assert.deepEqual(duePeriods('2026-11-23'), [])
})

test('the account book holds every kind of transaction, pending donations excluded', () => {
  const ledger = buildLedger(DATA, NUMBERS)
  assert.deepEqual(ledger.map(r => r.key).sort(), ['d-d0', 'd-d1', 'e-e0', 'e-e1', 'i-i1', 'i-i2', 's-ab12cd34'])
  assert.equal(ledger.find(r => r.key === 's-ab12cd34').number, 'DVS-MS-202611-AB12CD')
})

test('statement: verified only, opening and closing balance', () => {
  const s = summarize(buildLedger(DATA, NUMBERS), '2026-11-01', '2026-11-15')
  const bdt = s.statements[0]
  assert.equal(bdt.opening, 400)            // 500 donation − 100 expense in October
  assert.equal(bdt.totalIncome, 1500)       // 1000 + 200 + 300 (the unverified 50 is left out)
  assert.equal(bdt.totalExpense, 400)
  assert.equal(bdt.closing, 1500)
  assert.equal(s.pending.length, 1)
  const all = summarize(buildLedger(DATA, NUMBERS), '2026-11-01', '2026-11-15', { verifiedOnly: false })
  assert.equal(all.statements[0].totalIncome, 1550)
})

test('statement HTML and CSV carry the figures and the account book', () => {
  const s = summarize(buildLedger(DATA, NUMBERS), '2026-11-01', '2026-11-15')
  const html = statementHtml(s, { kind: 'last_fortnight', reportNo: 'R1' })
  assert.match(html, /Fortnightly Income &amp; Expenditure Statement|Fortnightly Income & Expenditure Statement/)
  assert.match(html, /Closing balance/)
  assert.match(html, /DVS-INC-2/) // listed under "awaiting verification"
  const csv = ledgerCsv(s)
  assert.match(csv, /closing balance,,,,,BDT,1500\.00/)
})

test('recipients are cleaned and checked', () => {
  assert.deepEqual(cleanRecipients('A@x.org, b@y.com; a@x.org bad'), { valid: ['a@x.org', 'b@y.com'], invalid: ['bad'] })
})

function deps({ role = 'accounts_admin', recipients = ['auditor@example.org'], existing = false, now = '2026-11-01T02:00:00Z', mailOk = true } = {}) {
  const saved = []; const sent = []; const calls = []
  return { saved, sent, calls, d: {
    getRole: async () => role, loadData: async () => DATA, loadRecipients: async () => recipients,
    saveReport: async r => { saved.push(r); return `rep${saved.length}` }, findAutoReport: async () => existing,
    loadReport: async id => saved.find((_, i) => `rep${i + 1}` === id) || { id, report_no: 'X', title: 'T', period_start: 'a', period_end: 'b', html: '<p>', csv: 'x' },
    markSent: async (id, to) => sent.push({ id, to }),
    fetchFn: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return mailOk ? { ok: true, json: async () => ({ id: 'm1' }) } : { ok: false, status: 422, json: async () => ({ message: 'domain not verified' }) } },
    config: { resendKey: 're', emailFrom: 'Samiti <a@b.org>' }, now: () => new Date(now)
  } }
}

test('the scheduler prepares, archives and e-mails the due statements once', async () => {
  const { d, saved, calls } = deps()
  const out = await handleFinanceReport({ action: 'scheduled' }, d, { isCron: true })
  assert.equal(out.status, 200)
  assert.deepEqual(out.body.reports.map(r => [r.kind, r.start, r.end, r.email]), [['last_fortnight', '2026-10-16', '2026-10-31', 'sent'], ['last_month', '2026-10-01', '2026-10-31', 'sent']])
  assert.equal(saved.length, 2)
  assert.ok(saved.every(r => r.automatic && r.verified_only))
  assert.equal(calls[0].body.to[0], 'auditor@example.org')
  assert.equal(calls[0].body.attachments.length, 2)
  const again = deps({ existing: true })
  const second = await handleFinanceReport({ action: 'scheduled' }, again.d, { isCron: true })
  assert.equal(again.saved.length, 0)
  assert.equal(second.body.reports[0].status, 'already prepared')
})

test('only the scheduler may run the scheduled job, only staff may prepare', async () => {
  assert.equal((await handleFinanceReport({ action: 'scheduled' }, deps().d)).status, 403)
  assert.equal((await handleFinanceReport({ action: 'prepare', kind: 'month' }, deps({ role: null }).d)).status, 403)
})

test('staff prepare a custom statement and send it to someone', async () => {
  const { d, saved, calls } = deps({ now: '2026-11-23T10:00:00Z' })
  const out = await handleFinanceReport({ action: 'prepare', kind: 'custom', from: '2026-11-01', to: '2026-11-15', send: true, recipients: 'president@example.org' }, d, { userName: 'Treasurer' })
  assert.equal(out.status, 200)
  assert.equal(out.body.totals[0].closing, 1500)
  assert.equal(saved[0].automatic, false)
  assert.deepEqual(calls[0].body.to, ['president@example.org'])
  const bad = await handleFinanceReport({ action: 'prepare', kind: 'custom', from: '2026-11-15', to: '2026-11-01' }, d)
  assert.equal(bad.status, 400)
})

test('a failed e-mail is reported, the report is still archived', async () => {
  const { d, saved } = deps({ mailOk: false })
  const out = await handleFinanceReport({ action: 'prepare', kind: 'last_month', send: true }, d)
  assert.equal(out.status, 207)
  assert.match(out.body.email.error, /domain not verified/)
  assert.equal(saved.length, 1)
})
