import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { describeDbError } from '../lib/dbErrors'
import { ACTION_LABELS, ChangeDetails, STATUS_LABELS, TABLE_LABELS, useStaffEmails } from './ApprovalsManagement'

// Secretary: every change sent for approval, with its status and the admin's note.
export default function MyRequests() {
  const emails = useStaffEmails()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('pending_changes')
      .select('*')
      .eq('requested_by', user?.id)
      .order('requested_at', { ascending: false })
      .limit(300)
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function cancel(item) {
    if (!window.confirm('Withdraw this request? / অনুরোধটি প্রত্যাহার করবেন?')) return
    const { error } = await supabase.rpc('cancel_change', { p_id: item.id })
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Request withdrawn. / অনুরোধ প্রত্যাহার করা হয়েছে।'); await load() }
  }

  const shown = useMemo(() => items.filter(item => filter === 'all' || item.status === filter), [items, filter])

  return <div className="events-management">
    <div className="filter-row">
      <select aria-label="Status" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All requests / সব অনুরোধ ({items.length})</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <button type="button" onClick={load}>Refresh</button>
    </div>
    {message && <p className="event-message" role="status">{message}</p>}
    {loading ? <p>Loading...</p> : shown.length === 0 ? <p>No requests yet. / এখনো কোনো অনুরোধ নেই।</p> : (
      <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Sent</th><th>Section</th><th>Action</th><th>Item</th><th>Approver</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{shown.map(item => [
          <tr key={item.id}>
            <td>{new Date(item.requested_at).toLocaleString()}</td>
            <td>{TABLE_LABELS[item.table_name] || item.table_name}</td>
            <td>{ACTION_LABELS[item.action]}</td>
            <td>{item.summary || item.old_data?.title_en || item.old_data?.description || '—'}</td>
            <td>{item.approver_role === 'accounts_admin' ? 'Accounts Admin / হিসাব অ্যাডমিন' : 'Main Admin / প্রধান অ্যাডমিন'}</td>
            <td><span className={`badge badge-${item.status === 'pending' ? 'pending' : item.status === 'approved' ? 'verified' : 'rejected'}`}>{STATUS_LABELS[item.status]}</span>
              {item.review_note && <small className="cell-sub">“{item.review_note}”{item.reviewed_by && emails[item.reviewed_by] ? ` — ${emails[item.reviewed_by]}` : ''}</small>}</td>
            <td className="row-actions">
              <button type="button" onClick={() => setOpenId(openId === item.id ? null : item.id)}>{openId === item.id ? 'Close' : 'Details'}</button>
              {item.status === 'pending' && <button type="button" onClick={() => cancel(item)}>Withdraw / প্রত্যাহার</button>}
            </td>
          </tr>,
          openId === item.id && <tr key={`${item.id}-details`} className="history-row"><td colSpan="7"><ChangeDetails request={item} /></td></tr>
        ])}</tbody>
      </table></div>
    )}
  </div>
}
