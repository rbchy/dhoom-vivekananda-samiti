import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db, getCurrentStaffRole } from '../lib/staff'
import { checkAmount, checkText, checkTransactionRef, cleanErrors, todayISO } from '../lib/validation'
import { CURRENCIES, PAYMENT_METHODS, formatMoney, methodLabel } from '../lib/money'
import { headLabel, headsFromRows, nextNumber } from '../lib/finance'
import AccountHeadsManager from './AccountHeadsManager'
import { StatementPanel, ReportsArchive } from './FinanceStatements'
import { receiptUrl } from '../lib/receipts'
import { buildLedger, periodFor, PERIODS } from '../../supabase/functions/finance-report/statement.js'
import { NUMBERS } from '../../supabase/functions/finance-report/lib.js'
import { describeDbError } from '../lib/dbErrors'
import { downloadCsv } from '../lib/csv'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const CONFIG = {
  income: { table: 'income_entries', dateField: 'entry_date', numberField: 'receipt_no', partyField: 'received_from', prefix: 'DVS-INC', title: 'Other Income Entry / অন্যান্য আয়', numberLabel: 'Receipt No. / রসিদ নম্বর', partyLabel: 'Received From / কার কাছ থেকে' },
  expense: { table: 'expense_entries', dateField: 'expense_date', numberField: 'voucher_no', partyField: 'paid_to', prefix: 'EXP', title: 'Expenditure Entry / খরচ', numberLabel: 'Voucher No. / ভাউচার নম্বর', partyLabel: 'Paid To / কাকে দেওয়া হয়েছে' }
}

const emptyEntry = mode => ({ date: todayISO(), category: '', description: '', party: '', amount: '', currency: 'BDT', method: 'cash', reference: '', number: nextNumber(CONFIG[mode].prefix), approved_by: '', event_id: '', notes: '' })


function sumByCurrency(rows) {
  const totals = {}
  rows.forEach(row => { totals[row.currency] = (totals[row.currency] || 0) + Number(row.amount) })
  return totals
}

const showTotals = totals => (Object.keys(totals).length ? Object.entries(totals).map(([c, v]) => formatMoney(v, c)).join(' + ') : formatMoney(0))

function EntryForm({ mode, catalog, heads, existingNumbers, editing, onSaved, onCancel }) {
  const config = CONFIG[mode]
  const [form, setForm] = useState(() => editing ? editing.form : emptyEntry(mode))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const method = PAYMENT_METHODS.find(m => m.code === form.method)
  const categories = heads.filter(h => h.head_type === mode && (h.is_active || h.code === editing?.form.category))

  useEffect(() => { setForm(editing ? editing.form : emptyEntry(mode)); setErrors({}); setMessage('') }, [mode, editing])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function validate() {
    const number = form.number.trim()
    const duplicate = number && existingNumbers.some(n => n.number.toLowerCase() === number.toLowerCase() && n.id !== editing?.id)
    const found = cleanErrors({
      date: !form.date ? 'Date is required.' : form.date > todayISO() ? 'Date cannot be in the future.' : form.date < '2000-01-01' ? 'Date is too old.' : '',
      category: !categories.some(c => c.code === form.category) ? 'Choose a head.' : '',
      description: checkText(form.description, { label: 'Description', required: true, min: 3, max: 200 }),
      party: checkText(form.party, { label: mode === 'expense' ? 'Paid to' : 'Received from', required: mode === 'expense', min: 2, max: 100 }),
      amount: checkAmount(form.amount),
      method: PAYMENT_METHODS.some(m => m.code === form.method) ? '' : 'Choose a payment method.',
      reference: checkTransactionRef(form.reference, { required: method?.needsRef }) && (form.method === 'cheque' ? 'Cheque number is required (4–60 letters or digits).' : checkTransactionRef(form.reference, { required: method?.needsRef })),
      number: !number ? `${mode === 'expense' ? 'Voucher' : 'Receipt'} number is required.` : !/^[A-Za-z0-9\-/]{3,40}$/.test(number) ? 'Use only letters, digits, - and / (3–40).' : duplicate ? 'This number is already used.' : '',
      approved_by: checkText(form.approved_by, { label: 'Approved by', min: 2, max: 100 }),
      notes: checkText(form.notes, { label: 'Notes', max: 500 })
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setSaving(true)
    const payload = {
      [config.dateField]: form.date, category: form.category, description: form.description.trim(), [config.partyField]: form.party.trim() || null,
      amount: Number(form.amount), currency: form.currency, method: form.method, reference: form.reference.trim() || null,
      [config.numberField]: form.number.trim(), event_catalog_id: form.event_id || null, notes: form.notes.trim() || null
    }
    if (mode === 'expense') payload.approved_by = form.approved_by.trim() || null
    const result = editing
      ? await db(config.table).update(payload).eq('id', editing.id)
      : await db(config.table).insert(payload)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(`${mode === 'expense' ? 'Expense' : 'Income'} ${editing ? 'updated' : 'saved'} (${payload[config.numberField]}).`); setForm(emptyEntry(mode)); setErrors({}); onSaved() }
    setSaving(false)
  }

  const p = `fin-${mode}`
  const dirty = Boolean(form.description || form.amount || form.party)

  return <form className="event-form" onSubmit={handleSave} noValidate>
    <h3>{editing ? `Edit ${mode === 'expense' ? 'Expense' : 'Income'} — ${editing.form.number}` : config.title}</h3>
    <ErrorSummary errors={errors} />
    <div className="form-row">
      <div><label htmlFor={`${p}-date`}>Date / তারিখ *</label><input id={`${p}-date`} name="date" type="date" max={todayISO()} value={form.date} onChange={handleChange} {...invalidProps(errors, 'date', p)} /><FieldError id={`${p}-date-error`} message={errors.date} /></div>
      <div><label htmlFor={`${p}-number`}>{config.numberLabel} *</label><input id={`${p}-number`} name="number" value={form.number} onChange={handleChange} maxLength={40} {...invalidProps(errors, 'number', p)} /><FieldError id={`${p}-number-error`} message={errors.number} /></div>
    </div>
    <label htmlFor={`${p}-category`}>{mode === 'expense' ? 'Expenditure Head / ব্যয়ের খাত' : 'Income Head / আয়ের খাত'} *</label>
    <select id={`${p}-category`} name="category" value={form.category} onChange={handleChange} {...invalidProps(errors, 'category', p)}>
      <option value="">— Choose head / খাত বাছুন —</option>
      {categories.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
    </select>
    <FieldError id={`${p}-category-error`} message={errors.category} />
    <label htmlFor={`${p}-description`}>Description / বিবরণ *</label>
    <input id={`${p}-description`} name="description" value={form.description} onChange={handleChange} maxLength={200} placeholder={mode === 'expense' ? 'e.g. Flowers and fruits for Kali Puja' : 'e.g. Pranami box collection — Sunday worship'} {...invalidProps(errors, 'description', p)} />
    <FieldError id={`${p}-description-error`} message={errors.description} />
    <div className="form-row">
      <div><label htmlFor={`${p}-party`}>{config.partyLabel} {mode === 'expense' && '*'}</label><input id={`${p}-party`} name="party" value={form.party} onChange={handleChange} maxLength={100} {...invalidProps(errors, 'party', p)} /><FieldError id={`${p}-party-error`} message={errors.party} /></div>
      <div><label htmlFor={`${p}-event_id`}>Related Event / অনুষ্ঠান</label><select id={`${p}-event_id`} name="event_id" value={form.event_id} onChange={handleChange}><option value="">— Not for a specific event —</option>{catalog.map(c => <option key={c.id} value={c.id}>{c.name_en} — {c.name_bn}</option>)}</select></div>
    </div>
    <div className="form-row">
      <div><label htmlFor={`${p}-amount`}>Amount / পরিমাণ *</label><input id={`${p}-amount`} name="amount" inputMode="decimal" value={form.amount} onChange={handleChange} maxLength={12} {...invalidProps(errors, 'amount', p)} /><FieldError id={`${p}-amount-error`} message={errors.amount} /></div>
      <div><label htmlFor={`${p}-currency`}>Currency / মুদ্রা</label><select id={`${p}-currency`} name="currency" value={form.currency} onChange={handleChange}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
    </div>
    <div className="form-row">
      <div><label htmlFor={`${p}-method`}>Payment Method / মাধ্যম *</label><select id={`${p}-method`} name="method" value={form.method} onChange={handleChange}>{PAYMENT_METHODS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></div>
      <div><label htmlFor={`${p}-reference`}>{form.method === 'cheque' ? 'Cheque No.' : 'Transaction ID / Ref'} {method?.needsRef && '*'}</label><input id={`${p}-reference`} name="reference" value={form.reference} onChange={handleChange} maxLength={60} disabled={form.method === 'cash'} {...invalidProps(errors, 'reference', p)} /><FieldError id={`${p}-reference-error`} message={errors.reference} /></div>
    </div>
    {mode === 'expense' && <><label htmlFor={`${p}-approved_by`}>Approved By / অনুমোদনকারী</label><input id={`${p}-approved_by`} name="approved_by" value={form.approved_by} onChange={handleChange} maxLength={100} placeholder="e.g. Treasurer's name" {...invalidProps(errors, 'approved_by', p)} /><FieldError id={`${p}-approved_by-error`} message={errors.approved_by} /></>}
    <label htmlFor={`${p}-notes`}>Notes / মন্তব্য</label>
    <textarea id={`${p}-notes`} name="notes" rows="2" value={form.notes} onChange={handleChange} maxLength={500} {...invalidProps(errors, 'notes', p)} />
    <FieldError id={`${p}-notes-error`} message={errors.notes} />
    <div className="form-actions">
      <button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : mode === 'expense' ? 'Save Expense' : 'Save Income'}</button>
      {editing ? <button type="button" onClick={onCancel}>Cancel Edit</button> : <button type="button" onClick={() => { setForm(emptyEntry(mode)); setErrors({}) }}>Clear</button>}
      <BackToMainButton dirty={dirty} />
    </div>
    {message && <p className="event-message" role="status">{message}</p>}
  </form>
}

export default function FinanceManagement() {
  const [tab, setTab] = useState('report')
  const [data, setData] = useState({ donations: [], subPayments: [], subscriptions: [], income: [], expenses: [], catalog: [], heads: headsFromRows([]) })
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadAll() {
    const results = await Promise.all([
      supabase.from('donations').select('*').eq('status', 'verified'),
      supabase.from('subscription_payments').select('*'),
      supabase.from('subscriptions').select('id, donor_name'),
      supabase.from('income_entries').select('*'),
      supabase.from('expense_entries').select('*'),
      supabase.from('event_catalog').select('id, name_en, name_bn').order('sort_order'),
      supabase.from('account_heads').select('*').order('sort_order')
    ])
    const failed = results.slice(0, 6).find(r => r.error)
    if (failed) setMessage(describeDbError(failed.error))
    const [donations, subPayments, subscriptions, income, expenses, catalog, headRows] = results.map(r => r.data || [])
    setData({ donations, subPayments, subscriptions, income, expenses, catalog, heads: headsFromRows(results[6].error ? [] : headRows) })
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const eventName = id => data.catalog.find(c => c.id === id)?.name_en || ''

  // The account book: every verified donation, subscription payment, other income and expenditure (shared with the server reports)
  const ledger = useMemo(() => buildLedger(data, NUMBERS).map(row => ({
    ...row,
    editable: row.kind === 'income' || row.kind === 'expense' ? row.kind : null,
    receiptType: row.kind === 'expense' ? null : row.kind, receiptId: row.id,
    table: { subscription: 'subscription_payments', income: 'income_entries', expense: 'expense_entries' }[row.kind] || null
  })), [data])

  const [start, end] = periodFor(period, undefined, from, to)
  const role = getCurrentStaffRole()
  const canVerify = role === 'admin' || role === 'accounts_admin'
  const inPeriod = useMemo(() => ledger.filter(row => row.date >= start && row.date <= end), [ledger, start, end])
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    return inPeriod.filter(row => (typeFilter === 'all' || row.type === typeFilter) && (!term || `${row.description} ${row.party || ''} ${row.number || ''} ${row.reference || ''} ${row.category}`.toLowerCase().includes(term)))
  }, [inPeriod, typeFilter, search])

  const report = useMemo(() => {
    const incomeRows = inPeriod.filter(r => r.type === 'income')
    const expenseRows = inPeriod.filter(r => r.type === 'expense')
    const income = sumByCurrency(incomeRows)
    const expense = sumByCurrency(expenseRows)
    const net = {}
    new Set([...Object.keys(income), ...Object.keys(expense)]).forEach(c => { net[c] = (income[c] || 0) - (expense[c] || 0) })
    const group = (rows, keyOf) => {
      const map = {}
      rows.forEach(r => { const k = keyOf(r); map[k] = map[k] || []; map[k].push(r) })
      return Object.entries(map).map(([k, list]) => ({ name: k, totals: sumByCurrency(list), count: list.length })).sort((a, b) => b.count - a.count)
    }
    const eventIds = [...new Set(inPeriod.filter(r => r.eventId).map(r => r.eventId))]
    const byEvent = eventIds.map(id => {
      const rows = inPeriod.filter(r => r.eventId === id)
      const inc = sumByCurrency(rows.filter(r => r.type === 'income'))
      const exp = sumByCurrency(rows.filter(r => r.type === 'expense'))
      const balance = {}
      new Set([...Object.keys(inc), ...Object.keys(exp)]).forEach(c => { balance[c] = (inc[c] || 0) - (exp[c] || 0) })
      return { id, name: eventName(id) || 'Event', inc, exp, balance }
    })
    return { income, expense, net, incomeByCategory: group(incomeRows, r => r.category), expenseByCategory: group(expenseRows, r => r.category), byEvent }
  }, [inPeriod, data.catalog])

  function startEdit(row) {
    const raw = row.raw
    const config = CONFIG[row.editable]
    setEditing({ id: row.id, mode: row.editable, form: {
      date: row.date, category: raw.category, description: raw.description, party: raw[config.partyField] || '', amount: String(raw.amount), currency: raw.currency,
      method: raw.method, reference: raw.reference || '', number: raw[config.numberField] || '', approved_by: raw.approved_by || '', event_id: raw.event_catalog_id || '', notes: raw.notes || ''
    } })
    setTab(row.editable)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteRow(row) {
    if (!window.confirm(`Delete ${row.type} ${row.number || ''} of ${formatMoney(row.amount, row.currency)}? This cannot be undone.`)) return
    const { error } = await db(CONFIG[row.editable].table).delete().eq('id', row.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Entry deleted.'); await loadAll() }
  }

  // An authorised official (main admin / accounts admin, not the one who entered it) checks the entry against its voucher
  async function verifyRow(row) {
    const note = window.prompt(`Verify ${row.type} ${row.number || ''} of ${formatMoney(row.amount, row.currency)}?\nOptional note (e.g. "voucher checked"):`, '')
    if (note === null) return
    const { error } = await supabase.rpc('verify_transaction', { p_table: row.table, p_id: row.id, p_note: note })
    if (error) setMessage('Error: ' + (error.message || describeDbError(error)))
    else { setMessage(`Verified: ${row.number || row.description}`); await loadAll() }
  }

  async function unverifyRow(row) {
    const reason = window.prompt(`Take back the verification of ${row.number || row.description}? Give the reason (it is kept in the log):`, '')
    if (!reason) return
    const { error } = await supabase.rpc('unverify_transaction', { p_table: row.table, p_id: row.id, p_reason: reason })
    if (error) setMessage('Error: ' + (error.message || describeDbError(error)))
    else { setMessage(`Verification taken back: ${row.number || row.description}`); await loadAll() }
  }

  function exportCsv() {
    downloadCsv(`temple-ledger-${start}-to-${end > todayISO() ? todayISO() : end}.csv`, [
      { label: 'Date', value: 'date' }, { label: 'Type', value: 'type' }, { label: 'Source', value: 'source' }, { label: 'Category', value: 'category' },
      { label: 'Description', value: 'description' }, { label: 'Party', value: 'party' }, { label: 'Event', value: row => eventName(row.eventId) },
      { label: 'Income', value: row => (row.type === 'income' ? row.amount : '') }, { label: 'Expense', value: row => (row.type === 'expense' ? row.amount : '') },
      { label: 'Currency', value: 'currency' }, { label: 'Method', value: row => methodLabel(row.method) }, { label: 'Reference', value: 'reference' }, { label: 'Receipt / Voucher', value: 'number' },
      { label: 'Verified', value: row => (row.verified ? 'yes' : 'no') }, { label: 'Verified by', value: row => [row.verifiedBy, row.verifiedRole].filter(Boolean).join(', ') }
    ], shown)
  }

  const existingNumbers = useMemo(() => [
    ...data.income.filter(i => i.receipt_no).map(i => ({ id: i.id, number: i.receipt_no })),
    ...data.expenses.filter(e => e.voucher_no).map(e => ({ id: e.id, number: e.voucher_no })),
    ...data.donations.filter(d => d.receipt_no).map(d => ({ id: d.id, number: d.receipt_no }))
  ], [data])

  return <div className="events-management">
    <div className="tab-row" role="tablist">
      {[['report', '📊 Ledger & Reports / খাতা ও হিসাব'], ['statement', '🧾 Income & Expenditure Statement / আয়-ব্যয় বিবরণী'], ['archive', '🗄️ Prepared statements / প্রস্তুত বিবরণী'], ['income', '➕ Add Income / আয়'], ['expense', '➖ Add Expense / খরচ'], ['heads', '🗂️ Heads / খাত']].map(([key, label]) =>
        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'tab active' : 'tab'} onClick={() => { setTab(key); if (key !== 'income' && key !== 'expense') setEditing(null) }}>{label}</button>)}
    </div>
    {message && <p className="event-message" role="status">{message}</p>}

    {(tab === 'income' || tab === 'expense') && <EntryForm mode={tab} catalog={data.catalog} heads={data.heads} existingNumbers={existingNumbers} editing={editing && editing.mode === tab ? editing : null} onCancel={() => { setEditing(null); setTab('report') }} onSaved={async () => { const wasEditing = Boolean(editing); setEditing(null); await loadAll(); if (wasEditing) setTab('report') }} />}

    {tab === 'heads' && <AccountHeadsManager heads={data.heads} usedCodes={new Set([...data.income.map(i => `income|${i.category}`), ...data.expenses.map(e => `expense|${e.category}`)])} onChanged={loadAll} />}

    {(tab === 'report' || tab === 'statement') && <div className="filter-row no-print">
        <select aria-label="Period" value={period} onChange={e => setPeriod(e.target.value)}>
          {PERIODS.map(p => <option key={p.kind} value={p.kind}>{p.en} / {p.bn}</option>)}
        </select>
        {period === 'custom' && <><input type="date" aria-label="From" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /><span>to</span><input type="date" aria-label="To" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></>}
        <span className="field-hint">{start === '2000-01-01' ? 'All dates' : `${start} → ${end > todayISO() ? todayISO() : end}`}</span>
      </div>}

    {tab === 'statement' && <StatementPanel ledger={ledger} kind={period} start={start} end={end} onPrepared={() => setTab('archive')} />}
    {tab === 'archive' && <ReportsArchive />}

    {tab === 'report' && <>

      <div className="stat-row">
        <div className="stat-card stat-income"><span>Total income / মোট আয়</span><strong>{showTotals(report.income)}</strong><small>Donations, subscriptions and other income</small></div>
        <div className="stat-card stat-expense"><span>Total expenditure / মোট ব্যয়</span><strong>{showTotals(report.expense)}</strong><small>{inPeriod.filter(r => r.type === 'expense').length} expense entries</small></div>
        <div className="stat-card"><span>Balance / উদ্বৃত্ত</span><strong>{showTotals(report.net)}</strong><small>Income − expenditure</small></div>
      </div>

      <div className="report-grid">
        <div><h4>Income by category / আয়ের খাত</h4>{report.incomeByCategory.length === 0 ? <p className="field-hint">No income in this period.</p> : <table className="admin-table compact"><tbody>{report.incomeByCategory.map(g => <tr key={g.name}><td>{g.name}<small className="cell-sub">{g.count} entries</small></td><td className="num">{showTotals(g.totals)}</td></tr>)}</tbody></table>}</div>
        <div><h4>Expenditure by category / ব্যয়ের খাত</h4>{report.expenseByCategory.length === 0 ? <p className="field-hint">No expenditure in this period.</p> : <table className="admin-table compact"><tbody>{report.expenseByCategory.map(g => <tr key={g.name}><td>{g.name}<small className="cell-sub">{g.count} entries</small></td><td className="num">{showTotals(g.totals)}</td></tr>)}</tbody></table>}</div>
      </div>

      {report.byEvent.length > 0 && <div className="events-list"><h4>Event-wise account / অনুষ্ঠানভিত্তিক হিসাব</h4><div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Event</th><th>Income</th><th>Expenditure</th><th>Balance</th></tr></thead>
        <tbody>{report.byEvent.map(e => <tr key={e.id}><td>{e.name}</td><td className="num">{showTotals(e.inc)}</td><td className="num">{showTotals(e.exp)}</td><td className="num">{showTotals(e.balance)}</td></tr>)}</tbody>
      </table></div></div>}

      <div className="events-list">
        <h3>Ledger / খাতা ({shown.length})</h3>
        <div className="filter-row">
          <select aria-label="Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">Income and expenditure</option><option value="income">Income only</option><option value="expense">Expenditure only</option></select>
          <input className="management-search" aria-label="Search ledger" placeholder="Search description, name, receipt, voucher" value={search} maxLength={100} onChange={e => setSearch(e.target.value)} />
          <button type="button" onClick={exportCsv} disabled={!shown.length}>Download CSV</button>
        </div>
        {loading ? <p>Loading...</p> : shown.length === 0 ? <p>No entries in this period.</p> : <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Party</th><th>Income</th><th>Expense</th><th>Method / Ref</th><th>No.</th><th>Verified / যাচাই</th><th></th></tr></thead>
          <tbody>{shown.map(row => <tr key={row.key}>
            <td>{row.date}</td>
            <td>{row.category}<small className="cell-sub">{row.source}</small></td>
            <td>{row.description}{row.eventId && <small className="cell-sub">Event: {eventName(row.eventId)}</small>}</td>
            <td>{row.party || '—'}</td>
            <td className="num income-cell">{row.type === 'income' ? formatMoney(row.amount, row.currency) : ''}</td>
            <td className="num expense-cell">{row.type === 'expense' ? formatMoney(row.amount, row.currency) : ''}</td>
            <td>{methodLabel(row.method)}{row.reference && <small className="cell-sub">{row.reference}</small>}</td>
            <td>{row.number || '—'}</td>
            <td>{row.verified
              ? <><span className="badge badge-verified">✓ verified</span>{row.verifiedBy && <small className="cell-sub">{row.verifiedBy}{row.verifiedRole ? ` (${row.verifiedRole})` : ''}</small>}{role === 'admin' && row.table && <button type="button" className="link-button" onClick={() => unverifyRow(row)}>take back</button>}</>
              : <><span className="badge badge-pending">not verified</span>{canVerify && row.table && <button type="button" onClick={() => verifyRow(row)}>Verify</button>}</>}</td>
            <td className="row-actions">{row.receiptType && <a className="button-link" href={receiptUrl(row.receiptType, row.receiptId)} target="_blank" rel="noopener">রসিদ</a>}{row.editable && !row.verified ? <><button type="button" onClick={() => startEdit(row)}>Edit</button><button type="button" onClick={() => deleteRow(row)}>Delete</button></> : row.editable ? <small className="cell-sub">Locked (verified)</small> : <small className="cell-sub">{row.source.startsWith('Donation') ? 'Edit in Donations' : 'Edit in Subscriptions'}</small>}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </>}
  </div>
}
