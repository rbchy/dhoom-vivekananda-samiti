import { useEffect, useMemo, useState } from 'react'
import { receiptUrl } from '../lib/receipts'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkAmount, checkOptionalEmail, checkPhone, checkText, checkTransactionRef, cleanErrors, todayISO } from '../lib/validation'
import { CURRENCIES, PAYMENT_METHODS, formatMoney, methodLabel, monthLabel, monthStart } from '../lib/money'
import { describeDbError } from '../lib/dbErrors'
import { downloadCsv } from '../lib/csv'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const SUB_METHODS = PAYMENT_METHODS.filter(m => m.code !== 'cheque')
const STATUS_LABEL = { pending: 'Pending approval', active: 'Active', paused: 'Paused', cancelled: 'Cancelled' }
const thisMonth = () => monthStart().slice(0, 7)

function addMonths(yyyyMm, count) {
  const [y, m] = yyyyMm.split('-').map(Number)
  const date = new Date(y, m - 1 + count, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const emptySubscriber = () => ({ donor_name: '', phone: '', email: '', address: '', monthly_amount: '', currency: 'BDT', payment_method: 'cash', start_month: thisMonth(), notes: '' })

export default function SubscriptionsManagement() {
  const [subs, setSubs] = useState([])
  const [payments, setPayments] = useState([])
  const [form, setForm] = useState(emptySubscriber)
  const [errors, setErrors] = useState({})
  const [viewMonth, setViewMonth] = useState(thisMonth())
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [paying, setPaying] = useState(null)
  const [payForm, setPayForm] = useState(null)
  const [payErrors, setPayErrors] = useState({})
  const [historyId, setHistoryId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadAll() {
    const [subResult, payResult] = await Promise.all([
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('subscription_payments').select('*').order('month', { ascending: false })
    ])
    if (subResult.error) setMessage(describeDbError(subResult.error))
    else setSubs(subResult.data || [])
    if (!payResult.error) setPayments(payResult.data || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const paidKey = useMemo(() => new Set(payments.map(p => `${p.subscription_id}|${String(p.month).slice(0, 7)}`)), [payments])
  const isPaid = (sub, month) => paidKey.has(`${sub.id}|${month}`)
  const startOf = sub => String(sub.start_month).slice(0, 7)

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function validateSubscriber() {
    const phone = form.phone.replace(/\D/g, '')
    const duplicate = subs.find(s => s.status !== 'cancelled' && s.phone.replace(/\D/g, '') === phone)
    const found = cleanErrors({
      donor_name: checkText(form.donor_name, { label: 'Subscriber name', required: true, min: 2, max: 100 }),
      phone: checkPhone(form.phone, { required: true }) || (duplicate ? `${duplicate.donor_name} already has a subscription with this phone number.` : ''),
      email: checkOptionalEmail(form.email),
      address: checkText(form.address, { label: 'Address', max: 300 }),
      monthly_amount: checkAmount(form.monthly_amount, { label: 'Monthly amount', max: 1000000 }),
      start_month: !/^\d{4}-\d{2}$/.test(form.start_month) ? 'Start month is required.' : form.start_month < addMonths(thisMonth(), -24) ? 'Start month cannot be more than 2 years ago.' : form.start_month > addMonths(thisMonth(), 12) ? 'Start month must be within the next 12 months.' : '',
      notes: checkText(form.notes, { label: 'Notes', max: 500 })
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleAddSubscriber(event) {
    event.preventDefault()
    setMessage('')
    if (!validateSubscriber()) return
    setSaving(true)
    const { error } = await db('subscriptions').insert({
      donor_name: form.donor_name.trim(), phone: form.phone.trim(), email: form.email.trim() || null, address: form.address.trim() || null,
      monthly_amount: Number(form.monthly_amount), currency: form.currency, payment_method: form.payment_method,
      start_month: `${form.start_month}-01`, status: 'active', source: 'office', notes: form.notes.trim() || null
    })
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Subscriber added.'); setForm(emptySubscriber()); setErrors({}); await loadAll() }
    setSaving(false)
  }

  async function changeStatus(sub, status) {
    if (status === 'cancelled' && !window.confirm(`Cancel the monthly subscription of ${sub.donor_name}?`)) return
    setBusyId(sub.id)
    const { error } = await db('subscriptions').update({ status }).eq('id', sub.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage(`${sub.donor_name}: ${STATUS_LABEL[status]}.`); await loadAll() }
    setBusyId(null)
  }

  function openPayment(sub) {
    setPaying(sub)
    setPayErrors({})
    const firstDue = (() => {
      let month = startOf(sub)
      const last = thisMonth()
      while (month <= last) { if (!isPaid(sub, month)) return month; month = addMonths(month, 1) }
      return addMonths(last, 1)
    })()
    setPayForm({ month: firstDue, amount: String(sub.monthly_amount), currency: sub.currency, method: sub.payment_method === 'card' ? 'card' : sub.payment_method, transaction_ref: '', paid_on: todayISO() })
  }

  function handlePayChange(event) {
    const { name, value } = event.target
    setPayForm(previous => ({ ...previous, [name]: value }))
    setPayErrors(previous => ({ ...previous, [name]: '' }))
  }

  async function handleRecordPayment(event) {
    event.preventDefault()
    const method = PAYMENT_METHODS.find(m => m.code === payForm.method)
    const found = cleanErrors({
      month: !/^\d{4}-\d{2}$/.test(payForm.month) ? 'Choose the month being paid.'
        : payForm.month < startOf(paying) ? `Subscription starts in ${monthLabel(paying.start_month)}.`
        : payForm.month > addMonths(thisMonth(), 12) ? 'Advance payment is allowed up to 12 months ahead.'
        : isPaid(paying, payForm.month) ? `${monthLabel(payForm.month)} is already paid.` : '',
      amount: checkAmount(payForm.amount, { max: 1000000 }),
      transaction_ref: checkTransactionRef(payForm.transaction_ref, { required: method?.needsRef }),
      paid_on: !payForm.paid_on ? 'Payment date is required.' : payForm.paid_on > todayISO() ? 'Payment date cannot be in the future.' : ''
    })
    setPayErrors(found)
    if (Object.keys(found).length) return
    setBusyId(paying.id)
    const { error } = await db('subscription_payments').insert({
      subscription_id: paying.id, month: `${payForm.month}-01`, amount: Number(payForm.amount), currency: payForm.currency,
      method: payForm.method, transaction_ref: payForm.transaction_ref.trim() || null, paid_on: payForm.paid_on
    })
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage(`Payment for ${monthLabel(payForm.month)} recorded for ${paying.donor_name}.`); setPaying(null); await loadAll() }
    setBusyId(null)
  }

  async function deletePayment(payment) {
    if (!window.confirm(`Delete the payment for ${monthLabel(payment.month)}?`)) return
    const { error } = await db('subscription_payments').delete().eq('id', payment.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Payment deleted.'); await loadAll() }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return subs.filter(s => (statusFilter === 'all' || s.status === statusFilter) && (!term || `${s.donor_name} ${s.phone} ${s.email || ''}`.toLowerCase().includes(term)))
  }, [subs, statusFilter, search])

  const monthSummary = useMemo(() => {
    const active = subs.filter(s => s.status === 'active' && startOf(s) <= viewMonth)
    const paid = active.filter(s => isPaid(s, viewMonth))
    const collected = {}
    payments.filter(p => String(p.month).slice(0, 7) === viewMonth).forEach(p => { collected[p.currency] = (collected[p.currency] || 0) + Number(p.amount) })
    return { activeCount: active.length, paidCount: paid.length, dueCount: active.length - paid.length, collected }
  }, [subs, payments, viewMonth, paidKey])

  function monthsFor(sub) {
    const list = []
    let month = startOf(sub)
    const last = thisMonth()
    while (month <= last && list.length < 60) { list.push(month); month = addMonths(month, 1) }
    return list.reverse()
  }

  function exportCsv() {
    downloadCsv(`monthly-subscriptions-${viewMonth}.csv`, [
      { label: 'Name', value: 'donor_name' }, { label: 'Phone', value: 'phone' }, { label: 'Email', value: 'email' },
      { label: 'Monthly amount', value: 'monthly_amount' }, { label: 'Currency', value: 'currency' }, { label: 'Method', value: row => methodLabel(row.payment_method) },
      { label: 'Start month', value: row => startOf(row) }, { label: 'Status', value: 'status' }, { label: `Paid ${viewMonth}`, value: row => (isPaid(row, viewMonth) ? 'Paid' : 'Due') }
    ], filtered)
  }

  const dirty = Boolean(form.donor_name || form.phone || form.monthly_amount)
  const pendingCount = subs.filter(s => s.status === 'pending').length

  return <div className="events-management">
    <div className="filter-row">
      <label htmlFor="sub-view-month"><b>Month / মাস:</b></label>
      <input id="sub-view-month" type="month" value={viewMonth} max={addMonths(thisMonth(), 12)} onChange={e => e.target.value && setViewMonth(e.target.value)} />
    </div>
    <div className="stat-row">
      <div className="stat-card"><span>Active subscribers</span><strong>{monthSummary.activeCount}</strong><small>{monthLabel(viewMonth)}</small></div>
      <div className="stat-card"><span>Paid / পরিশোধিত</span><strong>{monthSummary.paidCount}</strong><small>{Object.entries(monthSummary.collected).map(([c, v]) => formatMoney(v, c)).join(' + ') || formatMoney(0)}</small></div>
      <div className={monthSummary.dueCount ? 'stat-card stat-alert' : 'stat-card'}><span>Due / বাকি</span><strong>{monthSummary.dueCount}</strong><small>Active, not yet paid</small></div>
      <div className={pendingCount ? 'stat-card stat-alert' : 'stat-card'}><span>New online requests</span><strong>{pendingCount}</strong><small>Approve to activate</small></div>
    </div>

    <h3>Add Monthly Subscriber (Office) / মাসিক চাঁদা দাতা যোগ করুন</h3>
    <form className="event-form" onSubmit={handleAddSubscriber} noValidate>
      <ErrorSummary errors={errors} />
      <label htmlFor="msub-donor_name">Name / নাম *</label>
      <input id="msub-donor_name" name="donor_name" value={form.donor_name} onChange={handleChange} maxLength={100} {...invalidProps(errors, 'donor_name', 'msub')} />
      <FieldError id="msub-donor_name-error" message={errors.donor_name} />
      <div className="form-row">
        <div>
          <label htmlFor="msub-phone">Phone / ফোন *</label>
          <input id="msub-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={20} {...invalidProps(errors, 'phone', 'msub')} />
          <FieldError id="msub-phone-error" message={errors.phone} />
        </div>
        <div>
          <label htmlFor="msub-email">Email / ইমেইল</label>
          <input id="msub-email" name="email" type="email" value={form.email} onChange={handleChange} maxLength={254} {...invalidProps(errors, 'email', 'msub')} />
          <FieldError id="msub-email-error" message={errors.email} />
        </div>
      </div>
      <label htmlFor="msub-address">Address / ঠিকানা</label>
      <input id="msub-address" name="address" value={form.address} onChange={handleChange} maxLength={300} {...invalidProps(errors, 'address', 'msub')} />
      <FieldError id="msub-address-error" message={errors.address} />
      <div className="form-row">
        <div>
          <label htmlFor="msub-monthly_amount">Monthly Amount / মাসিক পরিমাণ *</label>
          <input id="msub-monthly_amount" name="monthly_amount" inputMode="decimal" value={form.monthly_amount} onChange={handleChange} maxLength={10} {...invalidProps(errors, 'monthly_amount', 'msub')} />
          <FieldError id="msub-monthly_amount-error" message={errors.monthly_amount} />
        </div>
        <div>
          <label htmlFor="msub-currency">Currency / মুদ্রা</label>
          <select id="msub-currency" name="currency" value={form.currency} onChange={handleChange}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
        </div>
      </div>
      <div className="form-row">
        <div>
          <label htmlFor="msub-payment_method">Usual Payment Method / মাধ্যম</label>
          <select id="msub-payment_method" name="payment_method" value={form.payment_method} onChange={handleChange}>{SUB_METHODS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select>
        </div>
        <div>
          <label htmlFor="msub-start_month">Start Month / শুরুর মাস *</label>
          <input id="msub-start_month" name="start_month" type="month" value={form.start_month} onChange={handleChange} {...invalidProps(errors, 'start_month', 'msub')} />
          <FieldError id="msub-start_month-error" message={errors.start_month} />
        </div>
      </div>
      <label htmlFor="msub-notes">Notes / মন্তব্য</label>
      <textarea id="msub-notes" name="notes" rows="2" value={form.notes} onChange={handleChange} maxLength={500} {...invalidProps(errors, 'notes', 'msub')} />
      <FieldError id="msub-notes-error" message={errors.notes} />
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Subscriber'}</button>
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    {paying && payForm && (
      <form className="event-form pay-panel" onSubmit={handleRecordPayment} noValidate>
        <h3>Record Payment — {paying.donor_name}</h3>
        <ErrorSummary errors={payErrors} />
        <div className="form-row">
          <div>
            <label htmlFor="pay-month">Month Paid For / কোন মাসের *</label>
            <input id="pay-month" name="month" type="month" min={startOf(paying)} max={addMonths(thisMonth(), 12)} value={payForm.month} onChange={handlePayChange} {...invalidProps(payErrors, 'month', 'pay')} />
            <FieldError id="pay-month-error" message={payErrors.month} />
          </div>
          <div>
            <label htmlFor="pay-paid_on">Payment Date / তারিখ *</label>
            <input id="pay-paid_on" name="paid_on" type="date" max={todayISO()} value={payForm.paid_on} onChange={handlePayChange} {...invalidProps(payErrors, 'paid_on', 'pay')} />
            <FieldError id="pay-paid_on-error" message={payErrors.paid_on} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="pay-amount">Amount ({payForm.currency}) *</label>
            <input id="pay-amount" name="amount" inputMode="decimal" value={payForm.amount} onChange={handlePayChange} maxLength={10} {...invalidProps(payErrors, 'amount', 'pay')} />
            <FieldError id="pay-amount-error" message={payErrors.amount} />
          </div>
          <div>
            <label htmlFor="pay-method">Method / মাধ্যম</label>
            <select id="pay-method" name="method" value={payForm.method} onChange={handlePayChange}>{SUB_METHODS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select>
          </div>
        </div>
        <label htmlFor="pay-transaction_ref">Transaction ID {PAYMENT_METHODS.find(m => m.code === payForm.method)?.needsRef && '*'}</label>
        <input id="pay-transaction_ref" name="transaction_ref" value={payForm.transaction_ref} onChange={handlePayChange} maxLength={60} disabled={payForm.method === 'cash'} {...invalidProps(payErrors, 'transaction_ref', 'pay')} />
        <FieldError id="pay-transaction_ref-error" message={payErrors.transaction_ref} />
        <div className="form-actions">
          <button type="submit" disabled={busyId === paying.id}>Save Payment</button>
          <button type="button" onClick={() => setPaying(null)}>Cancel</button>
        </div>
      </form>
    )}

    <div className="events-list">
      <h3>Subscribers ({filtered.length})</h3>
      <div className="filter-row">
        <select aria-label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All status</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input className="management-search" aria-label="Search subscribers" placeholder="Search name, phone, email" value={search} maxLength={100} onChange={e => setSearch(e.target.value)} />
        <button type="button" onClick={exportCsv} disabled={!filtered.length}>Download CSV</button>
      </div>
      {loading ? <p>Loading...</p> : filtered.length === 0 ? <p>No subscribers yet.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Name</th><th>Monthly</th><th>Since</th><th>Status</th><th>{monthLabel(viewMonth)}</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(sub => {
            const started = startOf(sub) <= viewMonth
            const paid = isPaid(sub, viewMonth)
            const history = payments.filter(p => p.subscription_id === sub.id)
            return [
              <tr key={sub.id}>
                <td>{sub.donor_name}<small className="cell-sub">{sub.phone}{sub.source === 'online' ? ' · online' : ''}</small></td>
                <td className="num">{formatMoney(sub.monthly_amount, sub.currency)}<small className="cell-sub">{methodLabel(sub.payment_method)}</small></td>
                <td>{monthLabel(sub.start_month)}</td>
                <td><span className={`badge badge-${sub.status}`}>{STATUS_LABEL[sub.status]}</span></td>
                <td>{!started ? '—' : paid ? <span className="badge badge-verified">Paid</span> : sub.status === 'active' ? <span className="badge badge-due">Due</span> : '—'}</td>
                <td className="row-actions">
                  {sub.status === 'pending' && <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'active')}>Approve</button>}
                  {sub.status === 'active' && <button type="button" disabled={busyId === sub.id} onClick={() => openPayment(sub)}>Record Payment</button>}
                  {sub.status === 'active' && <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'paused')}>Pause</button>}
                  {sub.status === 'paused' && <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'active')}>Resume</button>}
                  <button type="button" onClick={() => setHistoryId(historyId === sub.id ? null : sub.id)}>{historyId === sub.id ? 'Hide history' : `History (${history.length})`}</button>
                  {sub.status !== 'cancelled' && <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'cancelled')}>Cancel</button>}
                </td>
              </tr>,
              historyId === sub.id && <tr key={`${sub.id}-history`} className="history-row"><td colSpan="6">
                <div className="month-grid">{monthsFor(sub).map(month => <span key={month} className={isPaid(sub, month) ? 'month-chip paid' : 'month-chip due'}>{monthLabel(month)} — {isPaid(sub, month) ? 'Paid' : 'Due'}</span>)}</div>
                {history.length > 0 && <table className="admin-table inner"><thead><tr><th>Month</th><th>Amount</th><th>Method</th><th>Ref</th><th>Paid on</th><th>Receipt</th></tr></thead><tbody>
                  {history.map(p => <tr key={p.id}><td>{monthLabel(p.month)}</td><td className="num">{formatMoney(p.amount, p.currency)}</td><td>{methodLabel(p.method)}</td><td>{p.transaction_ref || '—'}</td><td>{String(p.paid_on).slice(0, 10)}</td><td className="row-actions"><a className="button-link" href={receiptUrl('subscription', p.id)} target="_blank" rel="noopener">রসিদ</a><button type="button" onClick={() => deletePayment(p)}>Delete</button></td></tr>)}
                </tbody></table>}
              </td></tr>
            ]
          })}</tbody>
        </table></div>
      )}
    </div>
  </div>
}
