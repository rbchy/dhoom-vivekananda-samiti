import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { describeDbError } from '../lib/dbErrors'
import { getCurrentStaffRole } from '../lib/staff'

// Shared by the approval page (admins) and "My requests" (secretary).
export const TABLE_LABELS = {
  events: 'Events / অনুষ্ঠান',
  gallery: 'Gallery / গ্যালারি',
  announcements: 'Announcements / ঘোষণা',
  worship_schedule: 'Worship schedule / পূজার সময়সূচি',
  temple_highlights: 'Mission & Deities / লক্ষ্য ও দেবদেবী',
  temple_content: 'Temple content / মন্দিরের তথ্য',
  committee_contacts: 'Committee contacts / কমিটি',
  site_settings: 'Temple info / যোগাযোগের তথ্য',
  event_catalog: 'Yearly event list / বার্ষিক অনুষ্ঠান-তালিকা',
  donations: 'Donations / দান',
  subscriptions: 'Subscriptions / মাসিক চাঁদা',
  subscription_payments: 'Subscription payments / চাঁদা আদায়',
  income_entries: 'Income / আয়',
  expense_entries: 'Expenses / ব্যয়',
  account_heads: 'Account heads / হিসাবের খাত'
}

export const ACTION_LABELS = {
  insert: 'Add / যোগ',
  update: 'Edit / সম্পাদনা',
  upsert: 'Edit / সম্পাদনা',
  delete: 'Delete / মুছে ফেলা'
}

export const STATUS_LABELS = {
  pending: 'Pending / অপেক্ষমাণ',
  approved: 'Approved / অনুমোদিত',
  rejected: 'Rejected / বাতিল',
  cancelled: 'Cancelled / প্রত্যাহার'
}

const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at', 'recorded_by'])

function show(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Fields to display: what changes (edit), what is added (add) or what is removed (delete).
export function changedFields(request) {
  const before = request.old_data || {}
  const after = request.new_data || {}
  if (request.action === 'delete') {
    return Object.keys(before).filter(key => !HIDDEN_FIELDS.has(key)).map(key => ({ key, before: show(before[key]), after: '—' }))
  }
  return Object.keys(after)
    .filter(key => !HIDDEN_FIELDS.has(key))
    .filter(key => request.action === 'insert' || show(before[key]) !== show(after[key]))
    .map(key => ({ key, before: request.action === 'insert' ? '—' : show(before[key]), after: show(after[key]) }))
}

export function ChangeDetails({ request }) {
  const fields = changedFields(request)
  if (fields.length === 0) return <p>No visible changes.</p>
  return <table className="admin-table change-table">
    <thead><tr><th>Field</th><th>Before / আগে</th><th>After / পরে</th></tr></thead>
    <tbody>{fields.map(field => <tr key={field.key}>
      <td><code>{field.key}</code></td>
      <td>{field.before}</td>
      <td><strong>{field.after}</strong></td>
    </tr>)}</tbody>
  </table>
}

export function useStaffEmails() {
  const [emails, setEmails] = useState({})
  useEffect(() => {
    supabase.rpc('staff_emails').then(({ data }) => {
      setEmails(Object.fromEntries((data || []).map(row => [row.user_id, row.email])))
    })
  }, [])
  return emails
}

export default function ApprovalsManagement() {
  const role = getCurrentStaffRole()
  const emails = useStaffEmails()
  const [items, setItems] = useState([])
  const [view, setView] = useState('pending')
  const [openId, setOpenId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('pending_changes')
      .select('*')
      .eq('approver_role', role)
      .order('requested_at', { ascending: false })
      .limit(300)
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(item) {
    if (!window.confirm(`Approve this ${ACTION_LABELS[item.action]} request for ${TABLE_LABELS[item.table_name] || item.table_name}?`)) return
    setBusyId(item.id); setMessage('')
    const { error } = await supabase.rpc('approve_change', { p_id: item.id, p_note: null })
    setBusyId(null)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Approved — the change is now live. / অনুমোদিত হয়েছে।'); await load() }
  }

  async function reject(item) {
    const note = window.prompt('Reason for rejecting (the secretary will see this) / বাতিলের কারণ:')
    if (note === null) return
    if (!note.trim()) { setMessage('Please write a reason. / কারণ লিখুন।'); return }
    setBusyId(item.id); setMessage('')
    const { error } = await supabase.rpc('reject_change', { p_id: item.id, p_note: note.trim() })
    setBusyId(null)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Rejected. / বাতিল করা হয়েছে।'); await load() }
  }

  const shown = useMemo(() => items.filter(item => (view === 'pending' ? item.status === 'pending' : item.status !== 'pending')), [items, view])
  const pendingCount = items.filter(item => item.status === 'pending').length

  return <div className="events-management">
    <div className="filter-row">
      <select aria-label="Show" value={view} onChange={event => setView(event.target.value)}>
        <option value="pending">Waiting for approval / অনুমোদনের অপেক্ষায় ({pendingCount})</option>
        <option value="history">History / পুরনো সিদ্ধান্ত</option>
      </select>
      <button type="button" onClick={load}>Refresh</button>
    </div>
    {message && <p className="event-message" role="status">{message}</p>}
    {loading ? <p>Loading...</p> : shown.length === 0 ? <p>{view === 'pending' ? 'Nothing is waiting for approval. / অনুমোদনের অপেক্ষায় কিছু নেই।' : 'No decisions yet.'}</p> : (
      <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Requested</th><th>By</th><th>Section</th><th>Action</th><th>Item</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{shown.map(item => [
          <tr key={item.id} className={item.status === 'pending' ? 'row-strong' : ''}>
            <td>{new Date(item.requested_at).toLocaleString()}</td>
            <td>{emails[item.requested_by] || 'Secretary'}</td>
            <td>{TABLE_LABELS[item.table_name] || item.table_name}</td>
            <td>{ACTION_LABELS[item.action]}</td>
            <td>{item.summary || item.old_data?.title_en || item.old_data?.description || '—'}</td>
            <td><span className={`badge badge-${item.status === 'pending' ? 'pending' : item.status === 'approved' ? 'verified' : 'rejected'}`}>{STATUS_LABELS[item.status]}</span>
              {item.review_note && <small className="cell-sub">{item.review_note}</small>}
              {item.reviewed_by && <small className="cell-sub">{emails[item.reviewed_by] || ''}</small>}</td>
            <td className="row-actions">
              <button type="button" onClick={() => setOpenId(openId === item.id ? null : item.id)}>{openId === item.id ? 'Close' : 'Details'}</button>
              {item.status === 'pending' && <>
                <button type="button" disabled={busyId === item.id} onClick={() => approve(item)}>Approve / অনুমোদন</button>
                <button type="button" disabled={busyId === item.id} onClick={() => reject(item)}>Reject / বাতিল</button>
              </>}
            </td>
          </tr>,
          openId === item.id && <tr key={`${item.id}-details`} className="history-row"><td colSpan="7"><ChangeDetails request={item} /></td></tr>
        ])}</tbody>
      </table></div>
    )}
  </div>
}
