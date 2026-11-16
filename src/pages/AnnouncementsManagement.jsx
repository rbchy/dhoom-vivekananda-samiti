import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, cleanErrors } from '../lib/validation'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const LIMITS = { title: 150, message: 2000 }
const emptyForm = { title_en: '', title_bn: '', message_en: '', message_bn: '', is_published: false }

export default function AnnouncementsManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')

  async function loadItems() {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (error) setMessage('Error loading announcements: ' + error.message)
    else setItems(data || [])
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '', message_en: name.startsWith('message') ? '' : previous.message_en }))
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}) }

  function validate() {
    const noMessage = !form.message_en.trim() && !form.message_bn.trim()
    const title = form.title_en.trim().toLowerCase()
    const duplicate = items.find(item => item.id !== editingId && (item.title_en || '').trim().toLowerCase() === title)
    const found = cleanErrors({
      title_en: checkText(form.title_en, { label: 'English title', required: true, min: 3, max: LIMITS.title }) ||
        (duplicate ? 'An announcement with this title already exists.' : ''),
      title_bn: checkText(form.title_bn, { label: 'Bangla title', min: 2, max: LIMITS.title, bengali: true }),
      message_en: noMessage
        ? 'Write the announcement message in English or Bangla (at least one is required).'
        : checkText(form.message_en, { label: 'English message', min: 10, max: LIMITS.message }),
      message_bn: noMessage ? '' : checkText(form.message_bn, { label: 'Bangla message', min: 10, max: LIMITS.message, bengali: true })
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setSaving(true)
    const payload = { ...form, title_en: form.title_en.trim(), title_bn: form.title_bn.trim() || null, message_en: form.message_en.trim() || null, message_bn: form.message_bn.trim() || null }
    const result = editingId ? await db('announcements').update(payload).eq('id', editingId) : await db('announcements').insert(payload)
    if (result.error) setMessage('Error: ' + result.error.message)
    else { setMessage(editingId ? 'Announcement updated.' : 'Announcement added.'); resetForm(); await loadItems() }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return
    setDeletingId(id)
    const { error } = await db('announcements').delete().eq('id', id)
    if (error) setMessage('Error: ' + error.message)
    else { setMessage('Announcement deleted.'); if (editingId === id) resetForm(); await loadItems() }
    setDeletingId(null)
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setErrors({})
    setMessage('')
    setForm({ title_en: item.title_en || '', title_bn: item.title_bn || '', message_en: item.message_en || '', message_bn: item.message_bn || '', is_published: item.is_published ?? false })
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(emptyForm)

  return <div className="events-management">
    <h3>{editingId ? 'Edit Announcement' : 'Add Announcement'}</h3>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <ErrorSummary errors={errors} />

      <label htmlFor="ann-title_en">English Title *</label>
      <input id="ann-title_en" name="title_en" value={form.title_en} onChange={handleChange} placeholder="English title" maxLength={LIMITS.title} required {...invalidProps(errors, 'title_en', 'ann')} />
      <FieldError id="ann-title_en-error" message={errors.title_en} />

      <label htmlFor="ann-title_bn">বাংলা শিরোনাম</label>
      <input id="ann-title_bn" name="title_bn" value={form.title_bn} onChange={handleChange} placeholder="বাংলা শিরোনাম" maxLength={LIMITS.title} {...invalidProps(errors, 'title_bn', 'ann')} />
      <FieldError id="ann-title_bn-error" message={errors.title_bn} />

      <label htmlFor="ann-message_en">English Message</label>
      <textarea id="ann-message_en" name="message_en" value={form.message_en} onChange={handleChange} placeholder="English message" rows="4" maxLength={LIMITS.message} {...invalidProps(errors, 'message_en', 'ann')} />
      <small className="field-hint">{form.message_en.length}/{LIMITS.message} — English or Bangla message is required.</small>
      <FieldError id="ann-message_en-error" message={errors.message_en} />

      <label htmlFor="ann-message_bn">বাংলা বার্তা</label>
      <textarea id="ann-message_bn" name="message_bn" value={form.message_bn} onChange={handleChange} placeholder="বাংলা বার্তা" rows="4" maxLength={LIMITS.message} {...invalidProps(errors, 'message_bn', 'ann')} />
      <small className="field-hint">{form.message_bn.length}/{LIMITS.message}</small>
      <FieldError id="ann-message_bn-error" message={errors.message_bn} />

      <label className="publish-option"><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Publish this announcement</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Announcement' : 'Add Announcement'}</button>
        {editingId && <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list"><h3>Saved Announcements ({items.length})</h3><input className="management-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search announcements" aria-label="Search announcements" maxLength={100} />{items.filter(item => `${item.title_en || ''} ${item.title_bn || ''} ${item.message_en || ''} ${item.message_bn || ''}`.toLowerCase().includes(search.trim().toLowerCase())).map(item => <article className="event-item" key={item.id}><h4>{item.title_en}</h4><p>{item.message_en || item.message_bn}</p><p>{item.is_published ? 'Published' : 'Draft'}</p><button type="button" onClick={() => handleEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>{deletingId === item.id ? 'Deleting...' : 'Delete'}</button></article>)}</div>
  </div>
}
