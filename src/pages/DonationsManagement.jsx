import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkAmount, checkOptionalEmail, checkPhone, checkText, checkTransactionRef, cleanErrors, todayISO } from '../lib/validation'
import { CURRENCIES, PAYMENT_METHODS, formatMoney, methodLabel } from '../lib/money'
import { describeDbError } from '../lib/dbErrors'
import { downloadCsv } from '../lib/csv'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const OFFICE_METHODS = PAYMENT_METHODS.filter(m => m.office)
const GENERAL = 'General temple fund'
const OTHER = '__other__'

function newReceiptNo() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `DVS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

const makeEmptyForm = () => ({
  anonymous: false, donor_name: '', phone: '', email: '', address: '', amount: '', currency: 'BDT', method: 'cash',
  transaction_ref: '', receipt_no: newReceiptNo(), purpose_choice: '', purpose_other: '', donated_on: todayISO(), notes: ''
})

export default function DonationsManagement() {
  const [form, setForm] = useState(makeEmptyForm)
  const [errors, setErrors] = useState({})
  const [items, setItems] = useState([])
  const [catalog, setCatalog] = useState([])
  const [filters, setFilters] = useState({ channel: 'all', status: 'all', search: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadItems() {
    const { data, error } = await supabase.from('donations').select('*').order('donated_on', { ascending: false }).order('created_at', { ascending: false })
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
    supabase.from('event_catalog').select('id, name_en, name_bn').eq('is_active', true).order('sort_order').then(({ data }) => setCatalog(data || []))
  }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  const method = PAYMENT_METHODS.find(m => m.code === form.method)

  function validate() {
    const receipt = form.receipt_no.trim()
    const duplicateReceipt = receipt && items.some(item => (item.receipt_no || '').toLowerCase() === receipt.toLowerCase())
    const found = cleanErrors({
      donor_name: form.anonymous ? '' : checkText(form.donor_name, { label: 'Donor name', required: true, min: 2, max: 100 }),
      phone: checkPhone(form.phone),
      email: checkOptionalEmail(form.email),
      address: checkText(form.address, { label: 'Address', max: 300 }),
      amount: checkAmount(form.amount),
      method: OFFICE_METHODS.some(m => m.code === form.method) ? '' : 'Choose a payment method.',
      transaction_ref: checkTransactionRef(form.transaction_ref, { required: method?.needsRef }) && (form.method === 'cheque' ? 'Cheque number is required (4–60 letters or digits).' : checkTransactionRef(form.transaction_ref, { required: method?.needsRef })),
      receipt_no: !receipt ? 'Receipt number is required.' : !/^[A-Za-z0-9\-/]{3,40}$/.test(receipt) ? 'Receipt number may contain only letters, digits, - and / (3–40).' : duplicateReceipt ? 'This receipt number is already used.' : '',
      purpose_other: form.purpose_choice === OTHER ? checkText(form.purpose_other, { label: 'Purpose', required: true, min: 3, max: 150 }) : '',
      donated_on: !form.donated_on ? 'Donation date is required.' : form.donated_on > todayISO() ? 'Donation date cannot be in the future.' : form.donated_on < '2000-01-01' ? 'Donation date is too old.' : '',
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
    const picked = catalog.find(item => item.id === form.purpose_choice)
    const payload = {
      channel: 'office',
      status: 'verified',
      donor_name: form.anonymous ? 'Anonymous' : form.donor_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      amount: Number(form.amount),
      currency: form.currency,
      method: form.method,
      transaction_ref: form.transaction_ref.trim() || null,
      receipt_no: form.receipt_no.trim(),
      purpose: picked ? picked.name_en : form.purpose_choice === OTHER ? form.purpose_other.trim() : GENERAL,
      event_catalog_id: picked ? picked.id : null,
      donated_on: form.donated_on,
      notes: form.notes.trim() || null
    }
    const { error } = await db('donations').insert(payload)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage(`Donation saved. Receipt no. ${payload.receipt_no}`); setForm(makeEmptyForm()); setErrors({}); await loadItems() }
    setSaving(false)
  }

  async function setStatus(item, status) {
    setBusyId(item.id)
    const patch = { status }
    if (status === 'verified' && !item.receipt_no) patch.receipt_no = newReceiptNo()
    const { error } = await db('donations').update(patch).eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage(status === 'verified' ? 'Donation verified.' : 'Donation marked as rejected.'); await loadItems() }
    setBusyId(null)
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete the donation of ${formatMoney(item.amount, item.currency)} from ${item.donor_name}? This cannot be undone.`)) return
    setBusyId(item.id)
    const { error } = await db('donations').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Donation deleted.'); await loadItems() }
    setBusyId(null)
  }

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return items.filter(item =>
      (filters.channel === 'all' || item.channel === filters.channel) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (!term || `${item.donor_name} ${item.phone || ''} ${item.receipt_no || ''} ${item.transaction_ref || ''} ${item.purpose}`.toLowerCase().includes(term))
    )
  }, [items, filters])

  const totals = useMemo(() => {
    const month = todayISO().slice(0, 7)
    const result = {}
    CURRENCIES.forEach(c => { result[c.code] = { month: 0, all: 0 } })
    items.filter(item => item.status === 'verified').forEach(item => {
      const bucket = result[item.currency]
      if (!bucket) return
      bucket.all += Number(item.amount)
      if (String(item.donated_on).slice(0, 7) === month) bucket.month += Number(item.amount)
    })
    return result
  }, [items])

  const pendingCount = items.filter(item => item.status === 'pending').length
  const dirty = Boolean(form.donor_name || form.amount || form.phone || form.notes)

  function exportCsv() {
    downloadCsv(`donations-${todayISO()}.csv`, [
      { label: 'Date', value: 'donated_on' }, { label: 'Receipt No', value: 'receipt_no' }, { label: 'Donor', value: 'donor_name' },
      { label: 'Phone', value: 'phone' }, { label: 'Email', value: 'email' }, { label: 'Amount', value: 'amount' }, { label: 'Currency', value: 'currency' },
      { label: 'Method', value: row => methodLabel(row.method) }, { label: 'Transaction / Cheque', value: 'transaction_ref' },
      { label: 'Channel', value: 'channel' }, { label: 'Purpose', value: 'purpose' }, { label: 'Status', value: 'status' }, { label: 'Notes', value: 'notes' }
    ], filtered)
  }

  return <div className="events-management">
    <div className="stat-row">
      {CURRENCIES.map(c => <div className="stat-card" key={c.code}><span>This month ({c.code})</span><strong>{formatMoney(totals[c.code].month, c.code)}</strong><small>All time: {formatMoney(totals[c.code].all, c.code)}</small></div>)}
      <div className={pendingCount ? 'stat-card stat-alert' : 'stat-card'}><span>Online — waiting to verify</span><strong>{pendingCount}</strong><small>Check the transaction ID, then Verify</small></div>
    </div>

    <h3>Office Donation Entry / অফিসে দান গ্রহণ</h3>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <ErrorSummary errors={errors} />
      <label className="publish-option"><input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} /> Anonymous donor / নাম প্রকাশে অনিচ্ছুক</label>
      {!form.anonymous && <>
        <label htmlFor="off-donor_name">Donor Name / দাতার নাম *</label>
        <input id="off-donor_name" name="donor_name" value={form.donor_name} onChange={handleChange} maxLength={100} {...invalidProps(errors, 'donor_name', 'off')} />
        <FieldError id="off-donor_name-error" message={errors.donor_name} />
      </>}

      <div className="form-row">
        <div>
          <label htmlFor="off-phone">Phone / ফোন</label>
          <input id="off-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={20} {...invalidProps(errors, 'phone', 'off')} />
          <FieldError id="off-phone-error" message={errors.phone} />
        </div>
        <div>
          <label htmlFor="off-email">Email / ইমেইল</label>
          <input id="off-email" name="email" type="email" value={form.email} onChange={handleChange} maxLength={254} {...invalidProps(errors, 'email', 'off')} />
          <FieldError id="off-email-error" message={errors.email} />
        </div>
      </div>

      <label htmlFor="off-address">Address / ঠিকানা</label>
      <input id="off-address" name="address" value={form.address} onChange={handleChange} maxLength={300} {...invalidProps(errors, 'address', 'off')} />
      <FieldError id="off-address-error" message={errors.address} />

      <div className="form-row">
        <div>
          <label htmlFor="off-amount">Amount / পরিমাণ *</label>
          <input id="off-amount" name="amount" inputMode="decimal" value={form.amount} onChange={handleChange} maxLength={12} {...invalidProps(errors, 'amount', 'off')} />
          <FieldError id="off-amount-error" message={errors.amount} />
        </div>
        <div>
          <label htmlFor="off-currency">Currency / মুদ্রা</label>
          <select id="off-currency" name="currency" value={form.currency} onChange={handleChange}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor="off-method">Payment Method / মাধ্যম *</label>
          <select id="off-method" name="method" value={form.method} onChange={handleChange} {...invalidProps(errors, 'method', 'off')}>{OFFICE_METHODS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select>
          <FieldError id="off-method-error" message={errors.method} />
        </div>
        <div>
          <label htmlFor="off-transaction_ref">{form.method === 'cheque' ? 'Cheque No. / চেক নম্বর' : 'Transaction ID / ট্রানজেকশন আইডি'} {method?.needsRef && '*'}</label>
          <input id="off-transaction_ref" name="transaction_ref" value={form.transaction_ref} onChange={handleChange} maxLength={60} disabled={form.method === 'cash'} {...invalidProps(errors, 'transaction_ref', 'off')} />
          <FieldError id="off-transaction_ref-error" message={errors.transaction_ref} />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor="off-receipt_no">Receipt No. / রসিদ নম্বর *</label>
          <input id="off-receipt_no" name="receipt_no" value={form.receipt_no} onChange={handleChange} maxLength={40} {...invalidProps(errors, 'receipt_no', 'off')} />
          <FieldError id="off-receipt_no-error" message={errors.receipt_no} />
        </div>
        <div>
          <label htmlFor="off-donated_on">Date / তারিখ *</label>
          <input id="off-donated_on" name="donated_on" type="date" max={todayISO()} value={form.donated_on} onChange={handleChange} {...invalidProps(errors, 'donated_on', 'off')} />
          <FieldError id="off-donated_on-error" message={errors.donated_on} />
        </div>
      </div>

      <label htmlFor="off-purpose_choice">Purpose / উদ্দেশ্য</label>
      <select id="off-purpose_choice" name="purpose_choice" value={form.purpose_choice} onChange={handleChange}>
        <option value="">General temple fund / সাধারণ তহবিল</option>
        {catalog.map(item => <option key={item.id} value={item.id}>{item.name_en} — {item.name_bn}</option>)}
        <option value={OTHER}>Other (type below) / অন্যান্য</option>
      </select>
      {form.purpose_choice === OTHER && <>
        <input aria-label="Other purpose" name="purpose_other" value={form.purpose_other} onChange={handleChange} placeholder="e.g. Temple roof repair" maxLength={150} {...invalidProps(errors, 'purpose_other', 'off')} />
        <FieldError id="off-purpose_other-error" message={errors.purpose_other} />
      </>}

      <label htmlFor="off-notes">Notes / মন্তব্য</label>
      <textarea id="off-notes" name="notes" rows="2" value={form.notes} onChange={handleChange} maxLength={500} {...invalidProps(errors, 'notes', 'off')} />
      <FieldError id="off-notes-error" message={errors.notes} />

      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Donation'}</button>
        <button type="button" onClick={() => { setForm(makeEmptyForm()); setErrors({}) }} disabled={saving}>Clear</button>
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    <div className="events-list">
      <h3>All Donations ({filtered.length})</h3>
      <div className="filter-row">
        <select aria-label="Channel" value={filters.channel} onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}><option value="all">All channels</option><option value="office">Office</option><option value="online">Online</option></select>
        <select aria-label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="all">All status</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
        <input className="management-search" aria-label="Search donations" placeholder="Search name, phone, receipt, transaction ID" value={filters.search} maxLength={100} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        <button type="button" onClick={exportCsv} disabled={!filtered.length}>Download CSV</button>
        <a className="button-link" href={`${import.meta.env.BASE_URL}admin/receipt?blank=1&count=2`} target="_blank" rel="noopener">ফাঁকা রসিদ ছাপুন</a>
      </div>
      {loading ? <p>Loading...</p> : filtered.length === 0 ? <p>No donations found.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Method / Ref</th><th>Channel</th><th>Purpose</th><th>Receipt</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(item => <tr key={item.id}>
            <td>{String(item.donated_on).slice(0, 10)}</td>
            <td>{item.donor_name}{item.phone && <small className="cell-sub">{item.phone}</small>}</td>
            <td className="num">{formatMoney(item.amount, item.currency)}</td>
            <td>{methodLabel(item.method)}{item.transaction_ref && <small className="cell-sub">{item.transaction_ref}</small>}</td>
            <td>{item.channel === 'office' ? 'Office' : 'Online'}</td>
            <td>{item.purpose}</td>
            <td>{item.receipt_no || '—'}</td>
            <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
            <td className="row-actions">
              {item.status !== 'verified' && <button type="button" disabled={busyId === item.id} onClick={() => setStatus(item, 'verified')}>Verify</button>}
              {item.status === 'pending' && <button type="button" disabled={busyId === item.id} onClick={() => setStatus(item, 'rejected')}>Reject</button>}
              {item.status === 'verified' && <a className="button-link" href={`${import.meta.env.BASE_URL}admin/receipt?id=${item.id}`} target="_blank" rel="noopener">রসিদ / Receipt</a>}
              <button type="button" disabled={busyId === item.id} onClick={() => handleDelete(item)}>Delete</button>
            </td>
          </tr>)}</tbody>
        </table></div>
      )}
    </div>
  </div>
}
