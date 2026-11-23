// Pure logic for the finance-report Edge Function (no Deno APIs, so Node can test it).
// It prepares income & expenditure statements, keeps each one in the report archive and e-mails them.
import { buildLedger, duePeriods, ledgerCsv, rangeOf, statementHtml, statementTitle, summarize, todayBD } from './statement.js'
import { donationReceiptNo, incomeReceiptNo, subscriptionReceiptNo } from '../send-receipt/receipt-text.js'

const STAFF = ['admin', 'accounts_admin', 'secretary']
const KINDS = ['fortnight', 'last_fortnight', 'month', 'last_month', 'quarter', 'last_quarter', 'half_year', 'last_half_year',
  'fiscal_year', 'last_fiscal_year', 'year', 'last_year', 'all', 'custom']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const NUMBERS = { donation: donationReceiptNo, subscription: subscriptionReceiptNo, income: incomeReceiptNo }

export function cleanRecipients(list) {
  const emails = (Array.isArray(list) ? list : String(list || '').split(/[\s,;]+/)).map(s => String(s).trim().toLowerCase()).filter(Boolean)
  return { valid: [...new Set(emails.filter(e => EMAIL_RE.test(e)))].slice(0, 20), invalid: emails.filter(e => !EMAIL_RE.test(e)) }
}

const b64 = text => {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

const money = (n, c) => (c === 'BDT' ? '৳' : '$') + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

// Short e-mail; the full statement and the account book travel as attachments
function emailBody(report) {
  const t = report.totals || []
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
<p><b>ধুম বিবেকানন্দ সমিতি — ${report.title}</b><br>${report.period_start} to ${report.period_end}</p>
${t.map(s => `<p>${s.currency}: income ${money(s.totalIncome, s.currency)} · expenditure ${money(s.totalExpense, s.currency)} · ${s.result >= 0 ? 'surplus' : 'deficit'} ${money(Math.abs(s.result), s.currency)} · closing balance ${money(s.closing, s.currency)}</p>`).join('') || '<p>No transactions in this period.</p>'}
${report.pending_count ? `<p>${report.pending_count} transaction(s) still await verification.</p>` : ''}
<p>Attached: the statement (open in a browser to view or print / save as PDF) and the account book (CSV, opens in Excel).</p>
<p style="color:#777;font-size:12px">Report no. ${report.report_no} · prepared by ${report.prepared_by_name || 'the system'}</p></div>`
}

async function prepare(deps, { kind, start, end, verifiedOnly, auto, preparedByName }) {
  const data = await deps.loadData()
  const ledger = buildLedger(data, NUMBERS)
  const summary = summarize(ledger, start, end, { verifiedOnly })
  const preparedAt = deps.now().toISOString()
  const reportNo = `DVS-IE-${start.replace(/-/g, '')}-${end.replace(/-/g, '')}${auto ? '' : `-${preparedAt.slice(11, 19).replace(/:/g, '')}`}`
  const report = {
    report_no: reportNo, kind, title: statementTitle(kind), period_start: start, period_end: end, verified_only: verifiedOnly, automatic: auto,
    totals: summary.statements.map(({ currency, totalIncome, totalExpense, result, opening, closing, count }) => ({ currency, totalIncome, totalExpense, result, opening, closing, count })),
    transaction_count: summary.rows.length, pending_count: summary.pending.length, prepared_by_name: preparedByName,
    html: statementHtml(summary, { kind, preparedAt, preparedBy: preparedByName, reportNo }), csv: ledgerCsv(summary)
  }
  report.id = await deps.saveReport(report)
  return report
}

async function email(deps, report, recipients) {
  if (!(deps.config.resendKey && deps.config.emailFrom)) return { status: 'skipped', error: 'E-mail sending is not set up (RESEND_API_KEY / RECEIPT_EMAIL_FROM)' }
  if (!recipients.length) return { status: 'skipped', error: 'No recipients' }
  const res = await deps.fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${deps.config.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: deps.config.emailFrom, to: recipients, subject: `${report.title} ${report.period_start} – ${report.period_end} — ধুম বিবেকানন্দ সমিতি`,
      html: emailBody(report),
      attachments: [
        { filename: `${report.report_no}.html`, content: b64(report.html) },
        { filename: `${report.report_no}-account-book.csv`, content: b64(report.csv) }
      ]
    })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { status: 'failed', error: `E-mail service: ${data?.message || res.status}` }
  await deps.markSent(report.id, recipients)
  return { status: 'sent', to: recipients }
}

//   deps.getRole() / deps.loadData() / deps.loadRecipients() / deps.saveReport(row) → id / deps.findAutoReport(kind, start, end)
//   deps.loadReport(id) / deps.markSent(id, recipients) / deps.fetchFn / deps.config / deps.now()
//   isCron: the request came from the scheduler with the right secret
export async function handleFinanceReport(body, deps, { isCron = false, userName = '' } = {}) {
  if (!body || typeof body !== 'object') return { status: 400, body: { error: 'Missing request body' } }

  if (body.action === 'scheduled') {
    if (!isCron) return { status: 403, body: { error: 'Scheduler only' } }
    const today = todayBD(deps.now())
    const recipients = cleanRecipients(await deps.loadRecipients()).valid
    const done = []
    for (const kind of duePeriods(today)) {
      const [start, end] = rangeOf(kind, today)
      if (await deps.findAutoReport(kind, start, end)) { done.push({ kind, start, end, status: 'already prepared' }); continue }
      const report = await prepare(deps, { kind, start, end, verifiedOnly: true, auto: true, preparedByName: 'System (automatic)' })
      const sent = await email(deps, report, recipients)
      done.push({ kind, start, end, report_no: report.report_no, email: sent.status, error: sent.error })
    }
    return { status: 200, body: { today, reports: done } }
  }

  const role = await deps.getRole()
  if (!STAFF.includes(role)) return { status: 403, body: { error: 'Only staff can prepare or send statements' } }

  if (body.action === 'prepare') {
    const kind = body.kind || 'month'
    if (!KINDS.includes(kind)) return { status: 400, body: { error: 'Unknown period' } }
    if (kind === 'custom' && !(DATE_RE.test(body.from || '') && DATE_RE.test(body.to || '') && body.from <= body.to)) return { status: 400, body: { error: 'Give a valid from and to date' } }
    const [start, end] = kind === 'custom' ? [body.from, body.to] : rangeOf(kind, todayBD(deps.now()))
    const { valid, invalid } = cleanRecipients(body.recipients)
    if (invalid.length) return { status: 400, body: { error: `Not an e-mail address: ${invalid.join(', ')}` } }
    const report = await prepare(deps, { kind, start, end, verifiedOnly: body.verifiedOnly !== false, auto: false, preparedByName: userName || role })
    const sent = body.send ? await email(deps, report, valid.length ? valid : cleanRecipients(await deps.loadRecipients()).valid) : null
    return { status: sent?.status === 'failed' ? 207 : 200, body: { id: report.id, report_no: report.report_no, start, end, totals: report.totals, email: sent } }
  }

  if (body.action === 'send') {
    if (!body.report_id) return { status: 400, body: { error: 'report_id is required' } }
    const { valid, invalid } = cleanRecipients(body.recipients)
    if (invalid.length) return { status: 400, body: { error: `Not an e-mail address: ${invalid.join(', ')}` } }
    if (!valid.length) return { status: 400, body: { error: 'Give at least one e-mail address' } }
    const report = await deps.loadReport(body.report_id)
    if (!report) return { status: 404, body: { error: 'Report not found' } }
    const sent = await email(deps, report, valid)
    return { status: sent.status === 'failed' ? 207 : 200, body: { report_no: report.report_no, email: sent } }
  }

  return { status: 400, body: { error: 'action must be prepare, send or scheduled' } }
}
