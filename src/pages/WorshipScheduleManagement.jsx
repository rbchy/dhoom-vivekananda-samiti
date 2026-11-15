import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { checkText, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']
const EVERY_DAY = 'daily'
const emptyForm = { day: '0', title_en: '', title_bn: '', is_closed: false, start_time: '', end_time: '', note_en: '', note_bn: '', sort_order: '100', is_active: true }

export function formatTime(value) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  const date = new Date(2000, 0, 1, h, m)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export default function WorshipScheduleManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadItems() {
    const { data, error } = await supabase.from('worship_schedule').select('*').order('sort_order').order('start_time')
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '', end_time: name === 'start_time' ? '' : previous.end_time }))
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}) }

  function validate() {
    const order = String(form.sort_order).trim()
    let timeError = ''
    if (!form.is_closed) {
      if (!form.start_time) timeError = 'Start time is required (or tick "Closed").'
    }
    let endError = ''
    if (!form.is_closed && form.start_time && form.end_time && form.end_time <= form.start_time && form.end_time !== '00:00') {
      endError = 'End time must be after the start time (use 12:00 AM for midnight).'
    }
    const sameDay = items.find(item => item.id !== editingId && String(item.day_of_week ?? EVERY_DAY) === form.day && item.title_en.trim().toLowerCase() === form.title_en.trim().toLowerCase())
    const found = cleanErrors({
      title_en: checkText(form.title_en, { label: 'English title', required: true, min: 2, max: 120 }) || (sameDay ? 'This title already exists for the same day.' : ''),
      title_bn: checkText(form.title_bn, { label: 'Bangla title', max: 120, bengali: true }),
      start_time: timeError,
      end_time: endError,
      note_en: checkText(form.note_en, { label: 'English note', max: 300 }),
      note_bn: checkText(form.note_bn, { label: 'Bangla note', max: 300, bengali: true }),
      sort_order: !/^\d{1,4}$/.test(order) ? 'Display order must be a whole number from 0 to 9999.' : ''
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
      day_of_week: form.day === EVERY_DAY ? null : Number(form.day),
      title_en: form.title_en.trim(),
      title_bn: form.title_bn.trim() || null,
      is_closed: form.is_closed,
      start_time: form.is_closed ? null : form.start_time,
      end_time: form.is_closed ? null : form.end_time || null,
      note_en: form.note_en.trim() || null,
      note_bn: form.note_bn.trim() || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active
    }
    const result = editingId
      ? await supabase.from('worship_schedule').update(payload).eq('id', editingId)
      : await supabase.from('worship_schedule').insert(payload)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(editingId ? 'Schedule updated.' : 'Schedule added.'); resetForm(); await loadItems() }
    setSaving(false)
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setErrors({})
    setMessage('')
    setForm({
      day: item.day_of_week === null ? EVERY_DAY : String(item.day_of_week), title_en: item.title_en, title_bn: item.title_bn || '',
      is_closed: item.is_closed, start_time: (item.start_time || '').slice(0, 5), end_time: (item.end_time || '').slice(0, 5),
      note_en: item.note_en || '', note_bn: item.note_bn || '', sort_order: String(item.sort_order ?? 100), is_active: item.is_active
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title_en}" from the schedule?`)) return
    const { error } = await supabase.from('worship_schedule').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Schedule deleted.'); if (editingId === item.id) resetForm(); await loadItems() }
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(emptyForm)
  const dayText = item => (item.day_of_week === null ? 'Every day / প্রতিদিন' : `${DAYS[item.day_of_week]} / ${DAYS_BN[item.day_of_week]}`)

  return <div className="events-management">
    <h3>{editingId ? 'Edit Worship Schedule' : 'Add Worship Schedule / পূজার সময়সূচি যোগ করুন'}</h3>
    <p className="field-hint">Example: Sunday — Weekly Worship — 7:00 PM to 10:00 PM. For days the temple is closed, tick "Closed".</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <ErrorSummary errors={errors} />
      <div className="form-row">
        <div>
          <label htmlFor="ws-day">Day / দিন *</label>
          <select id="ws-day" name="day" value={form.day} onChange={handleChange}>
            <option value={EVERY_DAY}>Every day / প্রতিদিন</option>
            {DAYS.map((day, index) => <option key={day} value={index}>{day} / {DAYS_BN[index]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ws-sort_order">Display Order</label>
          <input id="ws-sort_order" name="sort_order" inputMode="numeric" value={form.sort_order} onChange={handleChange} maxLength={4} {...invalidProps(errors, 'sort_order', 'ws')} />
          <FieldError id="ws-sort_order-error" message={errors.sort_order} />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label htmlFor="ws-title_en">Title (English) *</label>
          <input id="ws-title_en" name="title_en" value={form.title_en} onChange={handleChange} placeholder="e.g. Morning Aarti, Weekly Worship" maxLength={120} {...invalidProps(errors, 'title_en', 'ws')} />
          <FieldError id="ws-title_en-error" message={errors.title_en} />
        </div>
        <div>
          <label htmlFor="ws-title_bn">শিরোনাম (বাংলা)</label>
          <input id="ws-title_bn" name="title_bn" value={form.title_bn} onChange={handleChange} placeholder="যেমন: মঙ্গল আরতি" maxLength={120} {...invalidProps(errors, 'title_bn', 'ws')} />
          <FieldError id="ws-title_bn-error" message={errors.title_bn} />
        </div>
      </div>
      <label className="publish-option"><input type="checkbox" name="is_closed" checked={form.is_closed} onChange={handleChange} /> Temple closed on this day / এই দিন মন্দির বন্ধ</label>
      {!form.is_closed && <div className="form-row">
        <div>
          <label htmlFor="ws-start_time">Start Time / শুরু *</label>
          <input id="ws-start_time" name="start_time" type="time" value={form.start_time} onChange={handleChange} {...invalidProps(errors, 'start_time', 'ws')} />
          <FieldError id="ws-start_time-error" message={errors.start_time} />
        </div>
        <div>
          <label htmlFor="ws-end_time">End Time / শেষ</label>
          <input id="ws-end_time" name="end_time" type="time" value={form.end_time} onChange={handleChange} {...invalidProps(errors, 'end_time', 'ws')} />
          <FieldError id="ws-end_time-error" message={errors.end_time} />
        </div>
      </div>}
      <div className="form-row">
        <div>
          <label htmlFor="ws-note_en">Note (English)</label>
          <input id="ws-note_en" name="note_en" value={form.note_en} onChange={handleChange} placeholder="e.g. Prasad distribution after aarti" maxLength={300} {...invalidProps(errors, 'note_en', 'ws')} />
          <FieldError id="ws-note_en-error" message={errors.note_en} />
        </div>
        <div>
          <label htmlFor="ws-note_bn">মন্তব্য (বাংলা)</label>
          <input id="ws-note_bn" name="note_bn" value={form.note_bn} onChange={handleChange} maxLength={300} {...invalidProps(errors, 'note_bn', 'ws')} />
          <FieldError id="ws-note_bn-error" message={errors.note_bn} />
        </div>
      </div>
      <label className="publish-option"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Schedule' : 'Add Schedule'}</button>
        {editingId && <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      <h3>Worship Schedule ({items.length})</h3>
      {loading ? <p>Loading...</p> : items.length === 0 ? <p>No schedule yet.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Day</th><th>Title</th><th>Time</th><th>Note</th><th>Show</th><th>Actions</th></tr></thead>
          <tbody>{[...items].sort((a, b) => (a.day_of_week ?? -1) - (b.day_of_week ?? -1) || a.sort_order - b.sort_order).map(item => <tr key={item.id} className={item.is_active ? '' : 'row-muted'}>
            <td>{dayText(item)}</td>
            <td>{item.title_en}{item.title_bn && <small className="cell-sub">{item.title_bn}</small>}</td>
            <td>{item.is_closed ? <span className="badge badge-cancelled">Closed</span> : `${formatTime(item.start_time)}${item.end_time ? ` – ${formatTime(item.end_time)}` : ''}`}</td>
            <td>{item.note_en || '—'}</td>
            <td>{item.is_active ? 'Yes' : 'Hidden'}</td>
            <td className="row-actions"><button type="button" onClick={() => handleEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
          </tr>)}</tbody>
        </table></div>
      )}
    </div>
  </div>
}
