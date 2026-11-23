import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCurrentStaffRole } from '../lib/staff'
import { formatMoney } from '../lib/money'
import { ledgerCsv, periodLabel, statementHtml, summarize } from '../../supabase/functions/finance-report/statement.js'

// Income & expenditure statements for audit: display, print, save, keep in the archive and send to anyone.
// The statement is the same document the system prepares and e-mails by itself every fortnight / month.

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function openWindow(html, print = false) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.open(); w.document.write(html); w.document.close()
  if (print) setTimeout(() => w.print(), 400)
  return true
}

async function callReports(body) {
  const { data, error } = await supabase.functions.invoke('finance-report', { body })
  if (error) {
    const detail = await error.context?.json?.().catch(() => null)
    if (detail?.email || detail?.report_no) return detail
    return { error: detail?.error || 'Could not reach the statement service (finance-report)' }
  }
  return data
}

const emailNote = email => !email ? '' : email.status === 'sent' ? `E-mailed to ${email.to.join(', ')}.` : `E-mail not sent: ${email.error}`

export function StatementPanel({ ledger, kind, start, end, onPrepared }) {
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [emails, setEmails] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const frame = useRef(null)
  const summary = useMemo(() => summarize(ledger, start, end, { verifiedOnly }), [ledger, start, end, verifiedOnly])
  const html = useMemo(() => statementHtml(summary, { kind, preparedBy: 'website (draft — not yet archived)', reportNo: 'DRAFT' }), [summary, kind])
  const fileBase = `DVS-income-expenditure-${start}-to-${end}`

  async function prepare(send) {
    setBusy(send ? 'send' : 'prepare'); setMessage('')
    const result = await callReports({ action: 'prepare', kind, from: start, to: end, verifiedOnly, send, recipients: emails })
    setBusy('')
    if (result.error) { setMessage(`Error: ${result.error}`); return }
    setMessage(`Statement ${result.report_no} prepared and kept in “Prepared statements”. ${emailNote(result.email)}`)
    if (!send && onPrepared) onPrepared()
  }

  return <div className="statement-panel">
    <div className="form-actions no-print statement-actions">
      <label className="inline-check"><input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} /> Verified transactions only / শুধু যাচাই করা লেনদেন</label>
      <button type="button" onClick={() => frame.current?.contentWindow?.print()}>🖨️ Print / PDF</button>
      <button type="button" onClick={() => openWindow(html)}>Open full page</button>
      <button type="button" onClick={() => download(`${fileBase}.html`, html, 'text/html')}>Save statement (HTML)</button>
      <button type="button" onClick={() => download(`${fileBase}-account-book.csv`, ledgerCsv(summary), 'text/csv')}>Save account book (CSV / Excel)</button>
      <button type="button" disabled={!!busy} onClick={() => prepare(false)}>{busy === 'prepare' ? 'Preparing…' : '🗄️ Prepare & keep in archive'}</button>
    </div>
    <div className="form-actions no-print statement-send">
      <input type="text" aria-label="Send to e-mail addresses" placeholder="Send to: auditor@example.com, president@example.com (empty = the usual recipients)" value={emails} onChange={e => setEmails(e.target.value)} />
      <button type="button" disabled={!!busy} onClick={() => prepare(true)}>{busy === 'send' ? 'Sending…' : '📧 Prepare & send by e-mail'}</button>
    </div>
    {message && <p className="event-message" role="status">{message}</p>}
    {summary.pending.length > 0 && <p className="field-hint no-print">⚠️ {summary.pending.length} transaction(s) of this period are not yet verified{verifiedOnly ? ' and are left out of the official statement' : ''} — verify them in “Ledger & Reports”.</p>}
    <p className="field-hint no-print">{periodLabel(kind).en} / {periodLabel(kind).bn}: {start} → {end}</p>
    <iframe ref={frame} title="Income and expenditure statement" className="statement-frame" srcDoc={html} />
  </div>
}

export function ReportsArchive() {
  const [reports, setReports] = useState([])
  const [recipients, setRecipients] = useState([])
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const role = getCurrentStaffRole()
  const canManage = role === 'admin' || role === 'accounts_admin'

  async function load() {
    const [r, p] = await Promise.all([
      supabase.from('finance_reports').select('id, report_no, kind, title, period_start, period_end, totals, automatic, verified_only, sent_to, sent_at, created_at, prepared_by_name, transaction_count, pending_count').order('period_end', { ascending: false }).order('created_at', { ascending: false }).limit(200),
      supabase.from('finance_report_recipients').select('*').order('created_at')
    ])
    if (r.error) setMessage(`Error: ${r.error.message} — has supabase/finance-audit.sql been run?`)
    setReports(r.data || []); setRecipients(p.data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function fullReport(id) {
    const { data, error } = await supabase.from('finance_reports').select('report_no, html, csv').eq('id', id).single()
    if (error) { setMessage(`Error: ${error.message}`); return null }
    return data
  }

  async function act(report, what) {
    const full = await fullReport(report.id)
    if (!full) return
    if (what === 'view') openWindow(full.html)
    if (what === 'print') openWindow(full.html, true)
    if (what === 'html') download(`${full.report_no}.html`, full.html, 'text/html')
    if (what === 'csv') download(`${full.report_no}-account-book.csv`, full.csv, 'text/csv')
  }

  async function send(report) {
    const to = window.prompt(`Send ${report.report_no} to which e-mail address(es)? Separate several with commas.`, recipients.filter(r => r.is_active).map(r => r.email).join(', '))
    if (!to) return
    setMessage('Sending…')
    const result = await callReports({ action: 'send', report_id: report.id, recipients: to })
    setMessage(result.error ? `Error: ${result.error}` : emailNote(result.email))
    load()
  }

  async function addRecipient(event) {
    event.preventDefault()
    const { error } = await supabase.from('finance_report_recipients').insert({ email: newRecipient.email.trim().toLowerCase(), name: newRecipient.name.trim() || null })
    if (error) setMessage(`Error: ${error.message}`)
    else { setNewRecipient({ email: '', name: '' }); load() }
  }
  async function toggleRecipient(r) { await supabase.from('finance_report_recipients').update({ is_active: !r.is_active }).eq('id', r.id); load() }
  async function removeRecipient(r) { if (window.confirm(`Remove ${r.email}?`)) { await supabase.from('finance_report_recipients').delete().eq('id', r.id); load() } }

  const totals = r => (r.totals || []).map(t => `${t.currency}: in ${formatMoney(t.totalIncome, t.currency)} · out ${formatMoney(t.totalExpense, t.currency)} · closing ${formatMoney(t.closing, t.currency)}`)

  return <div className="events-list">
    <h3>Prepared statements / প্রস্তুত বিবরণী</h3>
    <p className="field-hint">The system prepares the fortnightly statement on the 16th and on the 1st, and the monthly statement on the 1st (quarterly, half-yearly and yearly ones when a period ends), keeps them here and e-mails them to the recipients below. Statements prepared from the “Income &amp; Expenditure Statement” tab are kept here too. A prepared statement is never changed.</p>
    {message && <p className="event-message" role="status">{message}</p>}
    {loading ? <p>Loading…</p> : reports.length === 0 ? <p>No statements prepared yet.</p> : <div className="table-scroll"><table className="admin-table">
      <thead><tr><th>Period</th><th>Statement</th><th>Totals</th><th>Prepared</th><th>Sent to</th><th></th></tr></thead>
      <tbody>{reports.map(r => <tr key={r.id}>
        <td>{r.period_start} → {r.period_end}</td>
        <td>{r.title}<small className="cell-sub">{r.report_no} · {r.transaction_count} transactions{r.pending_count ? ` · ${r.pending_count} awaiting verification` : ''}{r.verified_only ? '' : ' · incl. unverified'}</small></td>
        <td>{totals(r).map(t => <small key={t} className="cell-sub">{t}</small>)}</td>
        <td>{new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}<small className="cell-sub">{r.automatic ? 'by the system' : r.prepared_by_name}</small></td>
        <td>{r.sent_to?.length ? r.sent_to.join(', ') : '—'}</td>
        <td className="row-actions">
          <button type="button" onClick={() => act(r, 'view')}>View</button>
          <button type="button" onClick={() => act(r, 'print')}>Print / PDF</button>
          <button type="button" onClick={() => act(r, 'html')}>Save</button>
          <button type="button" onClick={() => act(r, 'csv')}>CSV</button>
          <button type="button" onClick={() => send(r)}>Send</button>
        </td>
      </tr>)}</tbody>
    </table></div>}

    <h4>Who receives the statements / যাঁরা বিবরণী পাবেন</h4>
    <p className="field-hint">For example the president, the general secretary, the treasurer and the auditor.</p>
    {recipients.length > 0 && <table className="admin-table compact"><tbody>{recipients.map(r => <tr key={r.id}>
      <td>{r.email}{r.name && <small className="cell-sub">{r.name}</small>}</td>
      <td>{r.is_active ? <span className="badge badge-verified">receives</span> : <span className="badge badge-pending">paused</span>}</td>
      <td className="row-actions">{canManage && <><button type="button" onClick={() => toggleRecipient(r)}>{r.is_active ? 'Pause' : 'Resume'}</button><button type="button" onClick={() => removeRecipient(r)}>Remove</button></>}</td>
    </tr>)}</tbody></table>}
    {canManage && <form className="filter-row" onSubmit={addRecipient}>
      <input type="email" required placeholder="e-mail address" aria-label="Recipient e-mail" value={newRecipient.email} onChange={e => setNewRecipient(n => ({ ...n, email: e.target.value }))} />
      <input type="text" placeholder="name / role (optional)" aria-label="Recipient name" maxLength={100} value={newRecipient.name} onChange={e => setNewRecipient(n => ({ ...n, name: e.target.value }))} />
      <button type="submit">Add recipient</button>
    </form>}
  </div>
}
