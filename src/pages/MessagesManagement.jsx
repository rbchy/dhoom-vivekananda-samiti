import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { describeDbError } from '../lib/dbErrors'

const STATUS = { new: 'New', read: 'Read', replied: 'Replied' }

export default function MessagesManagement() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadItems() {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  async function setStatus(item, status) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else setItems(previous => previous.map(row => (row.id === item.id ? { ...row, status } : row)))
  }

  async function open(item) {
    setOpenId(openId === item.id ? null : item.id)
    if (item.status === 'new') await setStatus(item, 'read')
  }

  async function remove(item) {
    if (!window.confirm(`Delete the message from ${item.name}?`)) return
    const { error } = await supabase.from('contact_messages').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Message deleted.'); await loadItems() }
  }

  const shown = useMemo(() => items.filter(item => filter === 'all' || item.status === filter), [items, filter])
  const newCount = items.filter(item => item.status === 'new').length

  return <div className="events-management">
    <div className="filter-row">
      <select aria-label="Status" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All messages ({items.length})</option>
        {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      {newCount > 0 && <span className="badge badge-pending">{newCount} new</span>}
    </div>
    {message && <p className="event-message" role="status">{message}</p>}
    {loading ? <p>Loading...</p> : shown.length === 0 ? <p>No messages.</p> : (
      <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{shown.map(item => [
          <tr key={item.id} className={item.status === 'new' ? 'row-strong' : ''}>
            <td>{new Date(item.created_at).toLocaleString()}</td>
            <td>{item.name}<small className="cell-sub">{item.email}{item.phone ? ` · ${item.phone}` : ''}</small></td>
            <td>{item.subject || '(no subject)'}</td>
            <td><span className={`badge badge-msg-${item.status}`}>{STATUS[item.status]}</span></td>
            <td className="row-actions">
              <button type="button" onClick={() => open(item)}>{openId === item.id ? 'Close' : 'Open'}</button>
              <a className="row-link" href={`mailto:${item.email}?subject=${encodeURIComponent('Re: ' + (item.subject || 'Your message to the temple'))}`} onClick={() => setStatus(item, 'replied')}>Reply by email</a>
              <button type="button" onClick={() => remove(item)}>Delete</button>
            </td>
          </tr>,
          openId === item.id && <tr key={`${item.id}-body`} className="history-row"><td colSpan="5"><p className="message-body">{item.message}</p></td></tr>
        ])}</tbody>
      </table></div>
    )}
  </div>
}
