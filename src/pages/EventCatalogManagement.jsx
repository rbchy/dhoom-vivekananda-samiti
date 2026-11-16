import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
const emptyForm = { name_en: '', name_bn: '', usual_month: '', sort_order: '100', is_active: true }

export default function EventCatalogManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadItems() {
    const { data, error } = await supabase.from('event_catalog').select('*').order('sort_order').order('name_en')
    if (error) setMessage(describeDbError(error))
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}) }

  function validate() {
    const en = form.name_en.trim().toLowerCase()
    const bn = form.name_bn.trim()
    const dupEn = items.find(item => item.id !== editingId && item.name_en.trim().toLowerCase() === en)
    const dupBn = items.find(item => item.id !== editingId && item.name_bn.trim() === bn)
    const order = String(form.sort_order).trim()
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'English event name', required: true, min: 3, max: 150 }) || (dupEn ? 'This English name is already in the list.' : ''),
      name_bn: checkText(form.name_bn, { label: 'Bangla event name', required: true, min: 2, max: 150, bengali: true }) || (dupBn ? 'এই বাংলা নাম তালিকায় আগেই আছে।' : ''),
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
      name_en: form.name_en.trim(),
      name_bn: form.name_bn.trim(),
      usual_month: form.usual_month ? Number(form.usual_month) : null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active
    }
    const result = editingId
      ? await db('event_catalog').update(payload).eq('id', editingId)
      : await db('event_catalog').insert(payload)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(editingId ? 'Event name updated.' : 'Event name added to the yearly list.'); resetForm(); await loadItems() }
    setSaving(false)
  }

  async function toggleActive(item) {
    const { error } = await db('event_catalog').update({ is_active: !item.is_active }).eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else await loadItems()
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name_en}" from the yearly list? Events already saved will not be changed.`)) return
    const { error } = await db('event_catalog').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Event name removed.'); if (editingId === item.id) resetForm(); await loadItems() }
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setErrors({})
    setMessage('')
    setForm({ name_en: item.name_en, name_bn: item.name_bn, usual_month: item.usual_month ? String(item.usual_month) : '', sort_order: String(item.sort_order ?? 100), is_active: item.is_active })
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(emptyForm)

  return <div className="events-management">
    <h3>{editingId ? 'Edit Yearly Event Name' : 'Add Event to Yearly List'}</h3>
    <p className="field-hint">These names appear in the drop-down list of the Events form. / এই নামগুলো Events ফর্মের তালিকায় দেখাবে।</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <ErrorSummary errors={errors} />
      <label htmlFor="cat-name_en">English Event Name *</label>
      <input id="cat-name_en" name="name_en" value={form.name_en} onChange={handleChange} placeholder="e.g. Durga Puja" maxLength={150} {...invalidProps(errors, 'name_en', 'cat')} />
      <FieldError id="cat-name_en-error" message={errors.name_en} />

      <label htmlFor="cat-name_bn">বাংলা অনুষ্ঠানের নাম *</label>
      <input id="cat-name_bn" name="name_bn" value={form.name_bn} onChange={handleChange} placeholder="যেমন: দুর্গাপূজা" maxLength={150} {...invalidProps(errors, 'name_bn', 'cat')} />
      <FieldError id="cat-name_bn-error" message={errors.name_bn} />

      <label htmlFor="cat-usual_month">Usual Month / সাধারণত কোন মাসে</label>
      <select id="cat-usual_month" name="usual_month" value={form.usual_month} onChange={handleChange}>
        <option value="">Not fixed / নির্দিষ্ট নয়</option>
        {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month} / {MONTHS_BN[index]}</option>)}
      </select>

      <label htmlFor="cat-sort_order">Display Order</label>
      <input id="cat-sort_order" name="sort_order" inputMode="numeric" value={form.sort_order} onChange={handleChange} maxLength={4} {...invalidProps(errors, 'sort_order', 'cat')} />
      <small className="field-hint">Smaller numbers appear first in the list.</small>
      <FieldError id="cat-sort_order-error" message={errors.sort_order} />

      <label className="publish-option"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Show in the Events drop-down</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Name' : 'Add to List'}</button>
        {editingId && <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    <div className="events-list">
      <h3>Yearly Event List ({items.length})</h3>
      {loading ? <p>Loading...</p> : items.length === 0 ? <p>No event names yet.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>#</th><th>English</th><th>বাংলা</th><th>Usual month</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id} className={item.is_active ? '' : 'row-muted'}>
            <td>{item.sort_order}</td><td>{item.name_en}</td><td lang="bn">{item.name_bn}</td>
            <td>{item.usual_month ? `${MONTHS[item.usual_month - 1]} / ${MONTHS_BN[item.usual_month - 1]}` : '—'}</td>
            <td>{item.is_active ? 'Active' : 'Hidden'}</td>
            <td className="row-actions"><button type="button" onClick={() => handleEdit(item)}>Edit</button><button type="button" onClick={() => toggleActive(item)}>{item.is_active ? 'Hide' : 'Show'}</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
          </tr>)}</tbody>
        </table></div>
      )}
    </div>
  </div>
}
