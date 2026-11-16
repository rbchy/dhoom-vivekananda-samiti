import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { describeDbError } from '../lib/dbErrors'
import { STAFF_ROLES } from '../lib/staff'

// Main admin: who may use the admin panel, and with which role.
export default function StaffManagement() {
  const [people, setPeople] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('secretary')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase.rpc('list_staff')
    if (error) setMessage(describeDbError(error))
    else setPeople(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save(targetEmail, targetRole) {
    setBusy(true); setMessage('')
    const { error } = await supabase.rpc('set_staff_role', { p_email: targetEmail, p_role: targetRole })
    setBusy(false)
    if (error) { setMessage('Error: ' + describeDbError(error)); return false }
    setMessage(targetRole ? `Saved: ${targetEmail} is now ${STAFF_ROLES[targetRole].en}.` : `Access removed for ${targetEmail}.`)
    await load()
    return true
  }

  async function submit(event) {
    event.preventDefault()
    if (!email.trim()) { setMessage('Enter the person’s login e-mail.'); return }
    if (await save(email.trim(), role)) setEmail('')
  }

  async function remove(person) {
    if (!window.confirm(`Remove admin-panel access for ${person.email}? Their login stays, but they can no longer open the dashboard.`)) return
    await save(person.email, null)
  }

  return <div className="events-management">
    <p className="form-hint">
      A person needs a login first: Supabase → Authentication → Users → <strong>Add user</strong> (e-mail + password).
      Then choose their role here. / আগে Supabase-এ লগইন বানান, তারপর এখানে ভূমিকা দিন।
    </p>
    <form className="filter-row" onSubmit={submit}>
      <input type="email" aria-label="Login e-mail" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} />
      <select aria-label="Role" value={role} onChange={event => setRole(event.target.value)}>
        {Object.entries(STAFF_ROLES).map(([key, label]) => <option key={key} value={key}>{label.en} / {label.bn}</option>)}
      </select>
      <button type="submit" disabled={busy}>Give role / ভূমিকা দিন</button>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    {loading ? <p>Loading...</p> : (
      <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Login e-mail</th><th>Role</th><th>Last sign-in</th><th>Actions</th></tr></thead>
        <tbody>{people.map(person => <tr key={person.user_id}>
          <td>{person.email}</td>
          <td>
            <select aria-label={`Role of ${person.email}`} value={person.role || ''} disabled={busy}
              onChange={event => event.target.value ? save(person.email, event.target.value) : remove(person)}>
              <option value="">No access / প্রবেশাধিকার নেই</option>
              {Object.entries(STAFF_ROLES).map(([key, label]) => <option key={key} value={key}>{label.en} / {label.bn}</option>)}
            </select>
          </td>
          <td>{person.last_sign_in_at ? new Date(person.last_sign_in_at).toLocaleString() : 'Never'}</td>
          <td className="row-actions">{person.role && <button type="button" disabled={busy} onClick={() => remove(person)}>Remove access</button>}</td>
        </tr>)}</tbody>
      </table></div>
    )}
  </div>
}
