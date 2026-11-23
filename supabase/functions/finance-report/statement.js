// Shared, dependency-free accounting logic of Dhoom Vivekananda Samiti — used by the website (finance pages)
// and by the finance-report Edge Function (scheduled fortnightly / monthly statements), so both always agree.
//
// The account book (ledger) holds every transaction:
//   income  — verified donations, monthly subscription payments, other income
//   expense — every purchase / expenditure
// A transaction is "verified" when an authorised official (main admin or accounts admin — not the person who
// entered it) has checked it against the voucher / receipt. Official statements use verified transactions only.

// ---------- Periods (dates are YYYY-MM-DD strings in Bangladesh time) ----------

const pad = n => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate() // m = 1..12
const parts = date => String(date).slice(0, 10).split('-').map(Number)

// Today in Bangladesh (UTC+6), whatever the server's or browser's clock zone
export function todayBD(now = new Date()) {
  const t = new Date(now.getTime() + 6 * 3600 * 1000)
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

function shiftMonth(y, m, by) { const i = y * 12 + (m - 1) + by; return [Math.floor(i / 12), (i % 12) + 1] }

export const PERIODS = [
  { kind: 'fortnight', en: 'This fortnight', bn: 'চলতি পাক্ষিক' },
  { kind: 'last_fortnight', en: 'Last fortnight', bn: 'গত পাক্ষিক' },
  { kind: 'month', en: 'This month', bn: 'চলতি মাস' },
  { kind: 'last_month', en: 'Last month', bn: 'গত মাস' },
  { kind: 'quarter', en: 'This quarter', bn: 'চলতি ত্রৈমাসিক' },
  { kind: 'last_quarter', en: 'Last quarter', bn: 'গত ত্রৈমাসিক' },
  { kind: 'half_year', en: 'This half-year', bn: 'চলতি ষাণ্মাসিক' },
  { kind: 'fiscal_year', en: 'This financial year (Jul–Jun)', bn: 'চলতি অর্থবছর (জুলাই–জুন)' },
  { kind: 'last_fiscal_year', en: 'Last financial year', bn: 'গত অর্থবছর' },
  { kind: 'year', en: 'This calendar year', bn: 'চলতি পঞ্জিকা বছর' },
  { kind: 'last_year', en: 'Last calendar year', bn: 'গত পঞ্জিকা বছর' },
  { kind: 'all', en: 'All time', bn: 'শুরু থেকে' },
  { kind: 'custom', en: 'Custom dates', bn: 'নিজের পছন্দের তারিখ' }
]
export const periodLabel = kind => PERIODS.find(p => p.kind === kind) || PERIODS[0]

// [start, end] of a period around the reference day (both inclusive)
export function periodFor(kind, ref = todayBD(), from, to) {
  const [y, m, d] = parts(ref)
  const fortnight = (yy, mm, first) => first ? [iso(yy, mm, 1), iso(yy, mm, 15)] : [iso(yy, mm, 16), iso(yy, mm, lastDay(yy, mm))]
  const quarterStart = mm => Math.floor((mm - 1) / 3) * 3 + 1
  switch (kind) {
    case 'fortnight': return fortnight(y, m, d <= 15)
    case 'last_fortnight': {
      if (d > 15) return fortnight(y, m, true)
      const [py, pm] = shiftMonth(y, m, -1); return fortnight(py, pm, false)
    }
    case 'month': return [iso(y, m, 1), iso(y, m, lastDay(y, m))]
    case 'last_month': { const [py, pm] = shiftMonth(y, m, -1); return [iso(py, pm, 1), iso(py, pm, lastDay(py, pm))] }
    case 'quarter': { const qs = quarterStart(m); return [iso(y, qs, 1), iso(y, qs + 2, lastDay(y, qs + 2))] }
    case 'last_quarter': { const [py, pm] = shiftMonth(y, quarterStart(m), -3); return [iso(py, pm, 1), iso(py, pm + 2, lastDay(py, pm + 2))] }
    case 'half_year': return m <= 6 ? [iso(y, 1, 1), iso(y, 6, 30)] : [iso(y, 7, 1), iso(y, 12, 31)]
    case 'fiscal_year': return m >= 7 ? [iso(y, 7, 1), iso(y + 1, 6, 30)] : [iso(y - 1, 7, 1), iso(y, 6, 30)]
    case 'last_fiscal_year': return m >= 7 ? [iso(y - 1, 7, 1), iso(y, 6, 30)] : [iso(y - 2, 7, 1), iso(y - 1, 6, 30)]
    case 'year': return [iso(y, 1, 1), iso(y, 12, 31)]
    case 'last_year': return [iso(y - 1, 1, 1), iso(y - 1, 12, 31)]
    case 'custom': return [from || '2000-01-01', to || ref]
    default: return ['2000-01-01', '2999-12-31']
  }
}

// Which statements the system prepares by itself on a given day (run once a day by the scheduler)
//   16th of the month → the fortnight 1–15
//   1st of the month  → the fortnight 16–end and the whole month; on 1 Jan/Apr/Jul/Oct also the quarter,
//                       on 1 Jul and 1 Jan also the half-year, on 1 Jul also the financial year (July–June)
export function duePeriods(today = todayBD()) {
  const [, m, d] = parts(today)
  if (d === 16) return ['last_fortnight']
  if (d !== 1) return []
  const due = ['last_fortnight', 'last_month']
  if ([1, 4, 7, 10].includes(m)) due.push('last_quarter')
  if (m === 1 || m === 7) due.push('last_half_year')
  if (m === 7) due.push('last_fiscal_year')
  return due
}
// The half-year that has just ended (used only by the scheduler)
export function lastHalfYear(today = todayBD()) {
  const [y, m] = parts(today)
  return m <= 6 ? [iso(y - 1, 7, 1), iso(y - 1, 12, 31)] : [iso(y, 1, 1), iso(y, 6, 30)]
}
export const rangeOf = (kind, today) => kind === 'last_half_year' ? lastHalfYear(today) : periodFor(kind, today)

// ---------- The account book ----------

const LINE = {
  donation_office: 'Donations received at office — অফিসে প্রাপ্ত দান',
  donation_online: 'Donations received online — অনলাইনে প্রাপ্ত দান',
  subscription: 'Monthly subscriptions — মাসিক চাঁদা'
}

// heads: [{ head_type, code, label }]; returns ledger rows sorted newest first
export function buildLedger({ donations = [], subPayments = [], subscriptions = [], income = [], expenses = [], heads = [] }, numbers = {}) {
  const head = (type, code) => heads.find(h => h.head_type === type && h.code === code)?.label || code
  const subName = id => subscriptions.find(s => s.id === id)?.donor_name || 'Subscriber'
  const verifiedBy = r => r.verified_at ? { verified: true, verifiedAt: r.verified_at, verifiedBy: r.verified_by_name || '', verifiedRole: r.verified_role || '' } : { verified: false }
  const rows = [
    ...donations.filter(d => d.status === 'verified').map(d => ({
      key: `d-${d.id}`, kind: 'donation', id: d.id, raw: d, date: String(d.donated_on).slice(0, 10), type: 'income',
      source: d.channel === 'office' ? 'Donation (office)' : 'Donation (online)', line: d.channel === 'office' ? LINE.donation_office : LINE.donation_online,
      category: 'Donation — দান', description: d.purpose, party: d.anonymous ? 'Anonymous' : d.donor_name, amount: Number(d.amount), currency: d.currency,
      method: d.method, reference: d.transaction_ref, number: numbers.donation ? numbers.donation(d) : d.receipt_no, eventId: d.event_catalog_id || null,
      // A donation is checked when it is verified in the Donations list
      verified: true, verifiedAt: d.verified_at || null, verifiedBy: d.verified_by_name || '', verifiedRole: d.verified_role || ''
    })),
    ...subPayments.map(p => ({
      key: `s-${p.id}`, kind: 'subscription', id: p.id, raw: p, date: String(p.paid_on).slice(0, 10), type: 'income',
      source: 'Monthly subscription', line: LINE.subscription, category: 'Monthly subscription — মাসিক চাঁদা',
      description: `Subscription for ${String(p.month).slice(0, 7)}`, party: subName(p.subscription_id), amount: Number(p.amount), currency: p.currency,
      method: p.method, reference: p.transaction_ref, number: numbers.subscription ? numbers.subscription(p) : null, eventId: null, ...verifiedBy(p)
    })),
    ...income.map(i => ({
      key: `i-${i.id}`, kind: 'income', id: i.id, raw: i, date: String(i.entry_date).slice(0, 10), type: 'income',
      source: 'Other income', line: head('income', i.category), category: head('income', i.category), categoryCode: i.category,
      description: i.description, party: i.received_from, amount: Number(i.amount), currency: i.currency, method: i.method, reference: i.reference,
      number: numbers.income ? numbers.income(i) : i.receipt_no, eventId: i.event_catalog_id || null, ...verifiedBy(i)
    })),
    ...expenses.map(e => ({
      key: `e-${e.id}`, kind: 'expense', id: e.id, raw: e, date: String(e.expense_date).slice(0, 10), type: 'expense',
      source: 'Expense', line: head('expense', e.category), category: head('expense', e.category), categoryCode: e.category,
      description: e.description, party: e.paid_to, amount: Number(e.amount), currency: e.currency, method: e.method, reference: e.reference,
      number: e.voucher_no, approvedBy: e.approved_by, eventId: e.event_catalog_id || null, ...verifiedBy(e)
    }))
  ]
  return rows.sort((a, b) => b.date.localeCompare(a.date) || String(b.number || '').localeCompare(String(a.number || '')))
}

// Income & expenditure + receipts & payments for one period, per currency.
// opening = balance of everything before the period; closing = opening + income − expenditure.
export function summarize(ledger, start, end, { verifiedOnly = true } = {}) {
  const counted = ledger.filter(r => !verifiedOnly || r.verified)
  const inPeriod = counted.filter(r => r.date >= start && r.date <= end)
  const before = counted.filter(r => r.date < start)
  const pending = ledger.filter(r => !r.verified && r.date >= start && r.date <= end)
  const currencies = [...new Set([...inPeriod, ...before].map(r => r.currency))].sort()
  const sign = r => (r.type === 'income' ? 1 : -1) * r.amount
  const group = (rows, type) => {
    const map = new Map()
    rows.filter(r => r.type === type).forEach(r => {
      const g = map.get(r.line) || { name: r.line, amount: 0, count: 0 }
      g.amount += r.amount; g.count += 1; map.set(r.line, g)
    })
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }
  const statements = currencies.map(currency => {
    const rows = inPeriod.filter(r => r.currency === currency)
    const income = group(rows, 'income')
    const expense = group(rows, 'expense')
    const totalIncome = income.reduce((s, l) => s + l.amount, 0)
    const totalExpense = expense.reduce((s, l) => s + l.amount, 0)
    const opening = before.filter(r => r.currency === currency).reduce((s, r) => s + sign(r), 0)
    return { currency, income, expense, totalIncome, totalExpense, result: totalIncome - totalExpense, opening, closing: opening + totalIncome - totalExpense, count: rows.length }
  })
  return { start, end, verifiedOnly, statements, rows: inPeriod, pending }
}

// ---------- Output: HTML statement (display / print / save / e-mail) and CSV ----------

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const money = (n, currency) => (currency === 'BDT' ? '৳' : '$') + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)
const longDate = d => { const [y, m, dd] = parts(d); return `${dd} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}` }

export function statementTitle(kind) {
  const titles = { fortnight: 'Fortnightly', last_fortnight: 'Fortnightly', month: 'Monthly', last_month: 'Monthly', quarter: 'Quarterly', last_quarter: 'Quarterly',
    half_year: 'Half-yearly', last_half_year: 'Half-yearly', fiscal_year: 'Annual (financial year)', last_fiscal_year: 'Annual (financial year)', year: 'Annual', last_year: 'Annual' }
  return `${titles[kind] || 'Periodical'} Income & Expenditure Statement`
}

export function statementHtml(summary, { kind = 'custom', preparedAt = new Date().toISOString(), preparedBy = 'System', reportNo = '' } = {}) {
  const block = s => {
    const surplus = s.result >= 0
    const left = [...s.expense.map(l => [l.name, l.amount, l.count]), ...(surplus && s.result > 0 ? [['Excess of income over expenditure (Surplus) — উদ্বৃত্ত', s.result, null, true]] : [])]
    const right = [...s.income.map(l => [l.name, l.amount, l.count]), ...(!surplus ? [['Excess of expenditure over income (Deficit) — ঘাটতি', -s.result, null, true]] : [])]
    const total = Math.max(s.totalIncome, s.totalExpense)
    const n = Math.max(left.length, right.length, 1)
    const cell = (line, cur) => line ? `<td class="${line[3] ? 'bal' : ''}">${esc(line[0])}${line[2] ? ` <small>(${line[2]})</small>` : ''}</td><td class="num ${line[3] ? 'bal' : ''}">${money(line[1], cur)}</td>` : '<td></td><td></td>'
    return `<section><h3>Currency: ${s.currency === 'BDT' ? 'Bangladeshi Taka (৳)' : 'US Dollar ($)'}</h3>
<table><thead><tr><th>Expenditure / ব্যয়</th><th class="num">Amount</th><th>Income / আয়</th><th class="num">Amount</th></tr></thead><tbody>
${Array.from({ length: n }, (_, i) => `<tr>${cell(left[i], s.currency)}${cell(right[i], s.currency)}</tr>`).join('\n')}
</tbody><tfoot><tr><th>Total</th><th class="num">${money(total, s.currency)}</th><th>Total</th><th class="num">${money(total, s.currency)}</th></tr></tfoot></table>
<table class="cash"><tbody>
<tr><td>Opening balance (carried forward) / প্রারম্ভিক জের</td><td class="num">${money(s.opening, s.currency)}</td></tr>
<tr><td>Add: income of the period / আয়</td><td class="num">${money(s.totalIncome, s.currency)}</td></tr>
<tr><td>Less: expenditure of the period / ব্যয়</td><td class="num">${money(s.totalExpense, s.currency)}</td></tr>
<tr class="strong"><td>Closing balance (carried forward) / সমাপনী জের</td><td class="num">${money(s.closing, s.currency)}</td></tr>
</tbody></table></section>`
  }
  const register = summary.rows.slice().sort((a, b) => a.date.localeCompare(b.date))
  const pending = summary.pending
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(statementTitle(kind))} ${summary.start} to ${summary.end}</title>
<style>
body{font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif;color:#222;margin:24px;font-size:13px}
header{text-align:center;border-bottom:2px solid #b8862f;padding-bottom:8px;margin-bottom:14px}
h1{margin:0;color:#7a1f2b;font-size:22px}h2{margin:6px 0 2px;font-size:16px}h3{margin:16px 0 6px;font-size:14px;color:#7a1f2b}
p{margin:2px 0}table{width:100%;border-collapse:collapse;margin:6px 0}th,td{border:1px solid #cbbfae;padding:5px 7px;text-align:left;vertical-align:top}
thead th,tfoot th{background:#f6efe1}.num{text-align:right;white-space:nowrap}.bal{font-style:italic;color:#555}small{color:#777}
table.cash{width:60%;margin-left:auto}.strong td{font-weight:bold;background:#f6efe1}.meta{color:#555;font-size:12px}
.note{background:#fff6e0;border:1px solid #e6c870;padding:6px 8px;margin:8px 0}.sign{display:flex;gap:40px;margin-top:48px}.sign div{flex:1;text-align:center;border-top:1px solid #555;padding-top:4px}
@media print{body{margin:12mm}section,tr{break-inside:avoid}}
</style></head><body>
<header><h1>ধুম বিবেকানন্দ সমিতি — Dhoom Vivekananda Samiti</h1>
<p>Dhoom, Mahajanhat, Mirsarai, Chattogram · Established 1923 · A religious, non-profit humanitarian organisation</p>
<h2>${esc(statementTitle(kind))} / আয়-ব্যয় বিবরণী</h2>
<p>For the period ${longDate(summary.start)} to ${longDate(summary.end)}</p>
<p class="meta">${reportNo ? `Report no. ${esc(reportNo)} · ` : ''}Prepared ${esc(String(preparedAt).slice(0, 16).replace('T', ' '))} by ${esc(preparedBy)} · ${summary.verifiedOnly ? 'Verified transactions only' : 'Including transactions not yet verified'}</p></header>
${summary.statements.length ? summary.statements.map(block).join('\n') : '<p>No income or expenditure in this period.</p>'}
${pending.length ? `<p class="note">${pending.length} transaction(s) of this period are not yet verified and are ${summary.verifiedOnly ? 'not included above' : 'included above'} — see the list at the end.</p>` : ''}
<h3>Annexure A — Account book (cash book) of the period / হিসাব খাতা</h3>
<table><thead><tr><th>Date</th><th>No.</th><th>Particulars</th><th>Party</th><th>Head</th><th class="num">Income</th><th class="num">Expenditure</th><th>Method / Ref</th><th>Verified by</th></tr></thead><tbody>
${register.map(r => `<tr><td>${r.date}</td><td>${esc(r.number || '—')}</td><td>${esc(r.description)}</td><td>${esc(r.party || '—')}</td><td>${esc(r.line)}</td><td class="num">${r.type === 'income' ? money(r.amount, r.currency) : ''}</td><td class="num">${r.type === 'expense' ? money(r.amount, r.currency) : ''}</td><td>${esc(r.method || '')}${r.reference ? ` / ${esc(r.reference)}` : ''}</td><td>${r.verified ? esc([r.verifiedBy, r.verifiedRole].filter(Boolean).join(', ') || 'Verified') : '<b>Not verified</b>'}</td></tr>`).join('\n') || '<tr><td colspan="9">No transactions.</td></tr>'}
</tbody></table>
${pending.length ? `<h3>Annexure B — Awaiting verification / যাচাইয়ের অপেক্ষায়</h3><table><thead><tr><th>Date</th><th>No.</th><th>Particulars</th><th>Party</th><th class="num">Amount</th></tr></thead><tbody>
${pending.map(r => `<tr><td>${r.date}</td><td>${esc(r.number || '—')}</td><td>${esc(r.description)}</td><td>${esc(r.party || '—')}</td><td class="num">${r.type === 'expense' ? '−' : ''}${money(r.amount, r.currency)}</td></tr>`).join('\n')}</tbody></table>` : ''}
<div class="sign"><div>Prepared by</div><div>Treasurer / কোষাধ্যক্ষ</div><div>General Secretary / সাধারণ সম্পাদক</div><div>President / সভাপতি</div><div>Auditor / নিরীক্ষক</div></div>
</body></html>`
}

const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export function ledgerCsv(summary) {
  const head = ['Date', 'Type', 'No.', 'Particulars', 'Party', 'Head', 'Currency', 'Income', 'Expenditure', 'Method', 'Reference', 'Verified', 'Verified by']
  const rows = summary.rows.slice().sort((a, b) => a.date.localeCompare(b.date)).map(r => [r.date, r.type, r.number, r.description, r.party, r.line, r.currency,
    r.type === 'income' ? r.amount.toFixed(2) : '', r.type === 'expense' ? r.amount.toFixed(2) : '', r.method, r.reference, r.verified ? 'yes' : 'no', [r.verifiedBy, r.verifiedRole].filter(Boolean).join(', ')])
  const totals = summary.statements.flatMap(s => [
    ['', 'opening balance', '', '', '', '', s.currency, '', '', '', '', '', ''].map((v, i) => i === 7 ? s.opening.toFixed(2) : v),
    ['', 'total', '', '', '', '', s.currency, s.totalIncome.toFixed(2), s.totalExpense.toFixed(2), '', '', '', ''],
    ['', 'closing balance', '', '', '', '', s.currency, s.closing.toFixed(2), '', '', '', '', '']
  ])
  return '﻿' + [head, ...rows, ...totals].map(r => r.map(csvCell).join(',')).join('\r\n')
}
